const { socketAuth } = require('./socketAuth');

function registerSocketHandlers(io) {
  console.log('✅ registerSocketHandlers ejecutado');

  io.use((socket, next) => {
    console.log('🟡 Intentando autenticar socket...');
    socketAuth(socket, next);
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    console.log('🔌 Socket conectado:', {
      socketId: socket.id,
      userId: user.id,
      role: user.role,
      name: user.name,
    });

    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);

    if (user.role === 'admin') {
      socket.join('admins');
    }

    socket.emit('socket:connected', {
      message: 'Conexión socket establecida',
      user,
    });

    socket.on('notification:read', async (payload) => {
      try {
        console.log('📨 notification:read', payload);
      } catch (error) {
        console.error('❌ Error notification:read', error);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket desconectado:', {
        socketId: socket.id,
        userId: user.id,
        reason,
      });
    });
  });
}

module.exports = { registerSocketHandlers };