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
	
    clearUnits() {
        this.units_array = [];
    }
	
    moveUnit(fromHex, toHex) {
        for (var i in this.units_array) {
            const unit = this.units_array[i];
            if (fromHex && toHex && unit.coords.x == fromHex.col && unit.coords.y == fromHex.row) {
                unit.coords = {
                    x: toHex.col,
                    y: toHex.row
                }
                return true;
            }
        }

        return false;
    }
}

module.exports = { Player };