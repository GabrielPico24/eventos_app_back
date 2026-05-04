// services/event_reminder_job.service.js

const cron = require('node-cron');
const { DateTime } = require('luxon');

const Event = require('../models/event.model');
const User = require('../models/user.model');
const EventPushLog = require('../models/eventPushLog.model');
const { sendPushToUserTokens } = require('../utils/push.util');

const TZ = 'America/Guayaquil';

let jobStarted = false;

function parseEventDateTime(dateValue, timeValue) {
  try {
    const date = String(dateValue || '').trim();
    const time = String(timeValue || '').trim().toUpperCase();

    let day;
    let month;
    let year;

    if (date.includes('/')) {
      const parts = date.split('/');
      if (parts.length !== 3) return null;

      day = Number(parts[0]);
      month = Number(parts[1]);
      year = Number(parts[2]);
    } else if (date.includes('-')) {
      const parts = date.split('-');
      if (parts.length !== 3) return null;

      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else {
      return null;
    }

    let hour = 0;
    let minute = 0;

    if (time.includes('AM') || time.includes('PM')) {
      const clean = time.replaceAll(' ', '');
      const isPm = clean.includes('PM');
      const timeOnly = clean.replace('AM', '').replace('PM', '');
      const timeParts = timeOnly.split(':');

      hour = Number(timeParts[0]);
      minute = timeParts.length > 1 ? Number(timeParts[1]) : 0;

      if (isPm && hour !== 12) hour += 12;
      if (!isPm && hour === 12) hour = 0;
    } else {
      const timeParts = time.split(':');
      hour = Number(timeParts[0]);
      minute = timeParts.length > 1 ? Number(timeParts[1]) : 0;
    }

    if (!day || !month || !year || Number.isNaN(hour) || Number.isNaN(minute)) {
      return null;
    }

    return DateTime.fromObject(
      {
        year,
        month,
        day,
        hour,
        minute,
        second: 0,
        millisecond: 0,
      },
      {
        zone: TZ,
      }
    );
  } catch (_) {
    return null;
  }
}

function parseEndOfDay(dateValue) {
  try {
    const date = String(dateValue || '').trim();

    let day;
    let month;
    let year;

    if (date.includes('/')) {
      const parts = date.split('/');
      if (parts.length !== 3) return null;

      day = Number(parts[0]);
      month = Number(parts[1]);
      year = Number(parts[2]);
    } else if (date.includes('-')) {
      const parts = date.split('-');
      if (parts.length !== 3) return null;

      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else {
      return null;
    }

    return DateTime.fromObject(
      {
        year,
        month,
        day,
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999,
      },
      {
        zone: TZ,
      }
    );
  } catch (_) {
    return null;
  }
}

function isWeekday(dateTime) {
  return dateTime.weekday >= 1 && dateTime.weekday <= 5;
}

function isWeekend(dateTime) {
  return dateTime.weekday === 6 || dateTime.weekday === 7;
}

function nextOccurrence(current, repeat) {
  switch (repeat) {
    case 'hourly':
      return current.plus({ hours: 1 });

    case 'daily':
      return current.plus({ days: 1 });

    case 'weekdays': {
      let next = current.plus({ days: 1 });
      while (!isWeekday(next)) {
        next = next.plus({ days: 1 });
      }
      return next;
    }

    case 'weekends': {
      let next = current.plus({ days: 1 });
      while (!isWeekend(next)) {
        next = next.plus({ days: 1 });
      }
      return next;
    }

    case 'weekly':
      return current.plus({ weeks: 1 });

    case 'biweekly':
      return current.plus({ weeks: 2 });

    case 'monthly':
      return current.plus({ months: 1 });

    case 'quarterly':
      return current.plus({ months: 3 });

    case 'semiannual':
      return current.plus({ months: 6 });

    case 'yearly':
      return current.plus({ years: 1 });

    default:
      return null;
  }
}

function getDueOccurrences(event, from, to) {
  const start = parseEventDateTime(event.date, event.time);
  if (!start) return [];

  const repeat = event.repeat || 'never';

  if (repeat === 'never') {
    if (start >= from && start <= to) return [start];
    return [];
  }

  const end = event.repeatEndDate
    ? parseEndOfDay(event.repeatEndDate)
    : to.plus({ years: 1 });

  if (!end) return [];

  const occurrences = [];
  let current = start;
  let count = 0;
  const maxOccurrences = 2000;

  while (current <= end && count < maxOccurrences) {
    if (current >= from && current <= to) {
      occurrences.push(current);
    }

    if (current > to && occurrences.length > 0) {
      break;
    }

    const next = nextOccurrence(current, repeat);
    if (!next) break;

    current = next;
    count++;
  }

  return occurrences;
}

function getTargetUserIds(event) {
  const assignedIds = (event.assignedUsers || [])
    .map((item) => item.user?.toString())
    .filter(Boolean);

  if (assignedIds.length > 0) {
    return [...new Set(assignedIds)];
  }

  if (event.createdBy) {
    return [event.createdBy.toString()];
  }

  return [];
}

async function markInvalidTokens({ userId, invalidTokens = [] }) {
  if (!userId || invalidTokens.length === 0) return;

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'fcmTokens.$[tokenItem].isActive': false,
      },
    },
    {
      arrayFilters: [
        {
          'tokenItem.token': {
            $in: invalidTokens,
          },
        },
      ],
    }
  );
}

async function sendOccurrencePush({ event, occurrence }) {
  const occurrenceDate = occurrence.toJSDate();

  try {
    await EventPushLog.create({
      eventId: event._id,
      occurrenceAt: occurrenceDate,
      type: 'at_time',
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log('⏭️ Push ya enviada para ocurrencia:', {
        eventId: event._id.toString(),
        occurrence: occurrence.toFormat('dd/MM/yyyy HH:mm'),
      });
      return;
    }

    throw error;
  }

  const targetUserIds = getTargetUserIds(event);

  if (targetUserIds.length === 0) {
    console.log('⚠️ Evento sin usuarios destino:', event._id.toString());
    return;
  }

  const users = await User.find({
    _id: { $in: targetUserIds },
    isActive: true,
    'fcmTokens.isActive': true,
  }).select('_id name email fcmTokens');

  if (!users || users.length === 0) {
    console.log('⚠️ No hay usuarios con FCM activo para evento:', event._id.toString());
    return;
  }

  for (const user of users) {
    const result = await sendPushToUserTokens({
      user,
      title: event.title,
      body: event.description || 'Tienes un evento programado',
      data: {
        type: 'event_reminder',
        eventId: event._id.toString(),
        occurrenceAt: occurrence.toISO(),
        repeat: event.repeat || 'never',
      },
    });

    if (result?.invalidTokens?.length > 0) {
      await markInvalidTokens({
        userId: user._id,
        invalidTokens: result.invalidTokens,
      });
    }
  }

  console.log('✅ Push de ocurrencia enviada:', {
    eventId: event._id.toString(),
    title: event.title,
    occurrence: occurrence.toFormat('dd/MM/yyyy HH:mm'),
    users: users.length,
  });
}

async function checkEventReminders() {
  const now = DateTime.now().setZone(TZ);

  const from = now.minus({ seconds: 30 }).startOf('second');
  const to = now.plus({ seconds: 30 }).endOf('second');

  console.log('⏰ Revisando recordatorios:', {
    from: from.toFormat('dd/MM/yyyy HH:mm:ss'),
    to: to.toFormat('dd/MM/yyyy HH:mm:ss'),
  });

  const events = await Event.find({
    isActive: true,
    status: { $ne: 'cancelled' },
    notifyAtTime: true,
  }).select(
    '_id title description date time repeat repeatEndDate isActive status createdBy assignedUsers notifyAtTime'
  );

  for (const event of events) {
    const dueOccurrences = getDueOccurrences(event, from, to);

    for (const occurrence of dueOccurrences) {
      await sendOccurrencePush({
        event,
        occurrence,
      });
    }
  }
}

function startEventReminderJob() {
  if (jobStarted) return;
  jobStarted = true;

  cron.schedule(
    '* * * * *',
    async () => {
      try {
        await checkEventReminders();
      } catch (error) {
        console.error('❌ Error en job de recordatorios:', error);
      }
    },
    {
      timezone: TZ,
    }
  );

  console.log('✅ Job de recordatorios de eventos iniciado');
}

module.exports = {
  startEventReminderJob,
  checkEventReminders,
};