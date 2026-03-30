const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');

const loginUser = async ({ email, password }) => {
  console.log('🔎 Intentando login con:', email);

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  console.log('👤 Usuario encontrado:', user ? user.email : 'NO');

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  console.log('🟢 Usuario activo:', user.isActive);

  if (!user.isActive) {
    throw new Error('Usuario inactivo');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  console.log('🔐 Password correcta:', isMatch);

  if (!isMatch) {
    throw new Error('Credenciales incorrectas');
  }

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  console.log('🎫 TOKEN GENERADO');

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  };
};

const registerAdminIfNotExists = async () => {
  const exists = await User.findOne({ email: 'admin@eventos.com' });

  if (!exists) {
    const hashedPassword = await bcrypt.hash('123456', 10);

    await User.create({
      name: 'Administrador',
      email: 'admin@eventos.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin inicial creado: admin@eventos.com / 123456');
  }
};

module.exports = {
  loginUser,
  registerAdminIfNotExists,
};