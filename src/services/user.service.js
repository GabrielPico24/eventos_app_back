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

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};