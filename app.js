import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import LobbyManager from './server/lobby.js';
import http from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


var app = express();
var lobbyManager = new LobbyManager();
var serv = http.Server(app);

app.use(express.static(path.join(__dirname, 'client')));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

serv.listen(2000);
console.log("Server started.");

var io = new Server(serv, {});
io.sockets.on('connection', function(socket) {
    // Delegate the connection handling to lobby manager
    lobbyManager.handlePlayerConnection(socket, io);

    socket.on('disconnect', function() {
        lobbyManager.handlePlayerDisconnect(socket, io);
    });
});

