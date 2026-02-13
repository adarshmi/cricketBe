const { pool } = require('./config/database');
const { ensureTables } = require('./config/ensureTables');
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const { setIo, attachSocketHandlers } = require('./sockets/socketHandler');

const server = http.createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
});
setIo(io);
attachSocketHandlers();

const PORT = process.env.PORT || 3001;

ensureTables(pool)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  });
