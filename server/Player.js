// Import the Entity class
const { Entity } = require('./entity');

class Player {
    constructor(socket) {
        this.socket = socket;
        this.name = '';
		this.playerNumber = 0;
        this.turn = false;  // Indicates if it's the player's turn
		this.units_array = []
		this.base_actions = 3
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
	
	getUnitToMove(fromHex) {
		for (var i in this.units_array) {
            const unit = this.units_array[i];
            if (fromHex && unit.coords.x == fromHex.col && unit.coords.y == fromHex.row) {
				return i;
            }
        }
		
		return -1;
	}
	
    moveUnit(unitIndex, toHex) {
        this.units_array[unitIndex].coords = {
			x: toHex.col,
			y: toHex.row
		};
    }
}

module.exports = { Player };