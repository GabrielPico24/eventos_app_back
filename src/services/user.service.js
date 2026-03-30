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

const updateUser = async (id, payload) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (payload.email && payload.email.toLowerCase().trim() !== user.email) {
    const existingUser = await User.findOne({
      email: payload.email.toLowerCase().trim(),
      _id: { $ne: id },
    });

    if (existingUser) {
      throw new Error('Ya existe un usuario con ese correo');
    }
  }

  user.name = payload.name ?? user.name;
  user.email = payload.email?.toLowerCase().trim() ?? user.email;
  user.role = payload.role ?? user.role;
  user.isActive = payload.isActive ?? user.isActive;

  if (payload.password && payload.password.trim() != '') {
    user.password = await bcrypt.hash(payload.password, 10);
  }

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return true;
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};