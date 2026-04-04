const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const getUsers = async () => {
  return await User.find().select('-password').sort({ createdAt: -1 });
};

const createUser = async ({ name, email, password, role, isActive }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

  if (existingUser) {
    throw new Error('Ya existe un usuario con ese correo');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role,
    isActive,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};

const updateUser = async (id, data) => {
  const updateData = {
    name: data.name,
    email: data.email,
    role: data.role,
    isActive: data.isActive,
  };

  if (data.password && data.password.trim() !== '') {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    updateData.password = hashedPassword;
  }

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return user;
};

const registerFcmToken = async (userId, payload) => {
  const { token, installationId, platform, deviceName, appVersion } = payload;

  if (!token) {
    throw new Error('El token FCM es obligatorio');
  }

  if (!installationId) {
    throw new Error('El installationId es obligatorio');
  }

  if (!platform || !['android', 'ios'].includes(platform)) {
    throw new Error('La plataforma no es válida');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // 1) Limpiar este dispositivo de TODOS los demás usuarios
  await User.updateMany(
    { _id: { $ne: userId } },
    {
      $pull: {
        fcmTokens: { installationId },
      },
    }
  );

  // 2) Limpiar también en el usuario actual por si ya existía repetido
  user.fcmTokens = user.fcmTokens.filter(
    (item) => item.installationId !== installationId
  );

  // 3) Registrar el token actualizado
  user.fcmTokens.push({
    token,
    installationId,
    platform,
    deviceName: deviceName || '',
    appVersion: appVersion || '',
    isActive: true,
    lastSeenAt: new Date(),
  });

  await user.save();

  return {
    ok: true,
    message: 'Token FCM registrado correctamente',
  };
};

const removeFcmToken = async (userId, installationId) => {
  if (!installationId) {
    throw new Error('El installationId es obligatorio');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const before = user.fcmTokens.length;

  user.fcmTokens = user.fcmTokens.filter(
    (item) => item.installationId !== installationId
  );

  await user.save();

  return {
    ok: true,
    message:
      before === user.fcmTokens.length
        ? 'No existía token FCM para eliminar'
        : 'Token FCM eliminado correctamente',
  };
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  registerFcmToken,
  removeFcmToken,
};