var express = require('express');
var app = express();
var serv = require('http').Server(app);
 
app.use(express.static('client'));

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

 
serv.listen(2000);
console.log("Server started.");

//import classes
const { Entity, Player } = require('./Entity');

var SOCKET_LIST = {};
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
 
	Player.onConnect(socket);
 
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});
 
});

setInterval(function(){
	var pack = {
		player: Player.update(),
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions',pack);
	}
},1000/60);