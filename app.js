var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.use(express.static('client'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

serv.listen(2000);
console.log("Server started.");

// Import the lobby manager
var lobbyManager = require('./server/lobby'); // Import the lobby manager

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
    // Delegate the connection handling to lobby manager
    lobbyManager.handlePlayerConnection(socket, io);

    socket.on('disconnect', function() {
        lobbyManager.handlePlayerDisconnect(socket, io);
    });
});

