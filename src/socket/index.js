const { socketAuth } = require('./socketAuth');

const {
  getAdminDashboardStatsService,
} = require('../services/dashboard.service');

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
      console.log('🛡️ Admin unido a sala admins');
    }

    socket.emit('socket:connected', {
      message: 'Conexión socket establecida',
      user,
    });

    // =====================================================
    // DASHBOARD ADMIN - CARGA INICIAL POR WEBSOCKET
    // Flutter emite: dashboard:get-stats
    // Backend responde: dashboard:stats-updated
    // =====================================================
    socket.on('dashboard:get-stats', async () => {
      try {
        if (!socket.user || socket.user.role !== 'admin') {
          socket.emit('dashboard:stats-error', {
            message: 'No autorizado para consultar dashboard',
          });
          return;
        }

        const stats = await getAdminDashboardStatsService();

        console.log('📊 Dashboard enviado por socket =>', stats);

        socket.emit('dashboard:stats-updated', stats);
      } catch (error) {
        console.error('❌ dashboard:get-stats error:', error);

        socket.emit('dashboard:stats-error', {
          message: 'Error al obtener estadísticas del dashboard',
        });
      }
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