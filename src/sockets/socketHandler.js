let io = null;

function setIo(serverIo) {
  io = serverIo;
}

function getIo() {
  return io;
}

function emitScoreboardUpdate(matchId, scoreboard) {
  if (io) {
    io.to(`match:${matchId}`).emit('SCOREBOARD_UPDATE', scoreboard);
  }
}

function emitBallAdded(matchId, ball, scoreboard) {
  if (io) {
    io.to(`match:${matchId}`).emit('BALL_ADDED', { ball, scoreboard });
  }
}

function emitBallUndone(matchId, scoreboard) {
  if (io) {
    io.to(`match:${matchId}`).emit('BALL_UNDONE', { scoreboard });
  }
}

function attachSocketHandlers() {
  if (!io) return;
  io.on('connection', (socket) => {
    socket.on('join_match', (payload) => {
      const matchId = payload?.matchId ?? payload?.match_id;
      if (matchId != null) {
        socket.join(`match:${matchId}`);
      }
    });
  });
}

module.exports = {
  setIo,
  getIo,
  emitScoreboardUpdate,
  emitBallAdded,
  emitBallUndone,
  attachSocketHandlers,
};
