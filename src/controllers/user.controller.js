const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  registerFcmToken,
  removeFcmToken,
} = require('../services/user.service');

const { emitDashboardStats } = require('../services/dashboard.service');

const normalizeUserPayload = (user) => {
  if (!user) return null;

  const plainUser = user.toObject ? user.toObject() : user;

  return {
    ...plainUser,
    id: (plainUser._id || plainUser.id || '').toString(),
    _id: (plainUser._id || plainUser.id || '').toString(),
  };
};

const listUsers = async (req, res) => {
  try {
    const users = await getUsers();

    return res.json({
      ok: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

const createNewUser = async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        ok: false,
        message: 'name, email, password y role son obligatorios',
      });
    }

    const user = await createUser({
      name,
      email,
      password,
      role,
      isActive,
    });

    const userPayload = normalizeUserPayload(user);

    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('user:created', userPayload);
      console.log('📡 Emitido user:created', userPayload.id);

      await emitDashboardStats(io);
      console.log('📊 Emitido dashboard:stats-updated');
    }

    return res.status(201).json({
      ok: true,
      message: 'Usuario creado correctamente',
      data: userPayload,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

const editUser = async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    const userPayload = normalizeUserPayload(user);

    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('user:updated', userPayload);
      console.log('📡 Emitido user:updated', userPayload.id);

      await emitDashboardStats(io);
      console.log('📊 Emitido dashboard:stats-updated');
    }

    return res.json({
      ok: true,
      message: 'Usuario actualizado correctamente',
      data: userPayload,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

const removeUser = async (req, res) => {
  try {
    await deleteUser(req.params.id);

    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('user:deleted', { id: req.params.id });
      console.log('📡 Emitido user:deleted', req.params.id);

      await emitDashboardStats(io);
      console.log('📊 Emitido dashboard:stats-updated');
    }

    return res.json({
      ok: true,
      message: 'Usuario eliminado correctamente',
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

const saveMyFcmToken = async (req, res) => {
  try {
    console.log('📲 POST /api/users/me/fcm-token');
    console.log('👤 userId =>', req.user.id);
    console.log('📦 body =>', req.body);

    const result = await registerFcmToken(req.user.id, req.body);

    return res.json({
      ok: true,
      message: result.message,
    });
  } catch (error) {
    console.error('❌ Error registrando FCM token:', error.message);

    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

const deleteMyFcmToken = async (req, res) => {
  try {
    console.log('🗑 DELETE /api/users/me/fcm-token');
    console.log('👤 userId =>', req.user.id);
    console.log('📦 body =>', req.body);

    const result = await removeFcmToken(req.user.id, req.body.installationId);

    return res.json({
      ok: true,
      message: result.message,
    });
  } catch (error) {
    console.error('❌ Error eliminando FCM token:', error.message);

    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

module.exports = {
  listUsers,
  createNewUser,
  editUser,
  removeUser,
  saveMyFcmToken,
  deleteMyFcmToken,
};