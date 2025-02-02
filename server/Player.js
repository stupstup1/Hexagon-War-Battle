// Import the Entity class
const { Entity, Unit, Building, Leader, Farm, Barracks, Swordfighter, Archer, Cavalier, Catapult } = require('./entity');
const { Action } = require('./actions');



class Player {
    constructor(socket) {
        this.socket = socket;
        this.name = '';
		this.playerNumber = 0;
        this.turn = false;  // Indicates if it's the player's turn
		this.units_array = []
		this.base_actions = 3
        this.ID_count = 0 //this is for assigning entities unique IDs to later identify them
        this.EntityMap = {
            Leader: Leader,
            Swordfighter: Swordfighter,
            Archer: Archer,
            Cavalier: Cavalier,
            Catapult: Catapult,
            Barracks: Barracks,
            Farm: Farm
        }
        socket.on("iconClick", (data) => {
            if (!data.SelectedEntity) { console.log("null"); return; }
            for (let Unit of this.units_array){
                if (Unit.id === data.SelectedEntity.id) {  //if the entity's ID matches the entity actually recognized as an entity's ID on the server...
                    Unit.doAction(data.ActionType);
                }
            } 
        });
    }
		
	setTurn(isTurn) {
        this.turn = isTurn;
		this.socket.emit('turnUpdate', { isTurn: this.turn }) //hides or displays end turn button
    }
	
    spawnUnit(entityType, x, y) {
        this.ID_count += 1
        const newUnit = new this.EntityMap[entityType](x, y, this.ID_count);
        this.addUnit(newUnit)
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