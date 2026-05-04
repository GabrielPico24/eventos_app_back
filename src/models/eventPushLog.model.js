// models/eventPushLog.model.js

const mongoose = require('mongoose');

const eventPushLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    occurrenceAt: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['at_time'],
      default: 'at_time',
    },
  },
  {
    timestamps: true,
  }
);

eventPushLogSchema.index(
  {
    eventId: 1,
    occurrenceAt: 1,
    type: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model('EventPushLog', eventPushLogSchema);