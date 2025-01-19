// Import the Entity class
const { Entity } = require('./entity');

class Player {
    constructor(socket) {
        this.socket = socket;
        this.name = '';
		this.playerNumber = 0;
        this.turn = false;  // Indicates if it's the player's turn
		this.units_array = []
    }
		
	setTurn(isTurn) {
        this.turn = isTurn;
		this.socket.emit('turnUpdate', { isTurn: this.turn }) //hides or displays end turn button
    }
	
	setName(name) {
        this.name = name;
    }
	
	addUnit(unit) {	
		this.units_array.push(unit)
	}
		
}

module.exports = { Player };