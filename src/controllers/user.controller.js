const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../services/user.service');

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

    const io = req.app.get('io');
    if (io) {
      io.emit('user:created', user);
      console.log('📡 Emitido user:created', user._id);
    }

    return res.status(201).json({
      ok: true,
      message: 'Usuario creado correctamente',
      data: user,
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

    const io = req.app.get('io');
    if (io) {
      io.emit('user:updated', user);
      console.log('📡 Emitido user:updated', user._id);
    }

    return res.json({
      ok: true,
      message: 'Usuario actualizado correctamente',
      data: user,
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

    const io = req.app.get('io');
    if (io) {
      io.emit('user:deleted', { id: req.params.id });
      console.log('📡 Emitido user:deleted', req.params.id);
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

module.exports = {
  listUsers,
  createNewUser,
  editUser,
  removeUser,
};