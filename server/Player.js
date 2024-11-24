class Player {
    constructor(socket) {
        this.socket = socket;
        this.name = '';
		this.playerNumber = 0;
        this.turn = false;  // Indicates if it's the player's turn
    }
		
	setTurn(isTurn) {
        this.turn = isTurn;
		this.socket.emit('turnUpdate', { isTurn: this.turn }) //hides or displays end turn button
    }
	
	setName(name) {
        this.name = name;
    }
}

module.exports = { Player };