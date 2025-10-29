let io;
module.exports = {
  init: (server, corsOptions) => {
    io = require('socket.io')(server, {
      cors: corsOptions,
      transports: ['websocket', 'polling']
    });
    
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      
      socket.on('joinDoc', (docId) => {
        console.log('Client joining document room:', docId);
        socket.join(`doc:${docId}`);
        socket.emit('joined', { docId }); // Confirm join
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });
    
    return io;
  },
  get: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  }
};
