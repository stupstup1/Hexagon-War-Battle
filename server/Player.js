// Import the Entity class
const { Entity, Unit, Building, Leader, Farm, Barracks, Swordfighter, Archer, Cavalier, Catapult } = require('./entity');

class Player {
    constructor(socket) {
        this.socket = socket;
        this.name = '';
		this.playerNumber = 0;
        this.turn = false;  // Indicates if it's the player's turn
		this.entities_array = []
        this.current_actions = 0;
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
        socket.on("updateActionState", (data) => {
            if (!data.SelectedEntity) { console.log("null"); return; }
            let thisEntity = this.findServerEntity(data.SelectedEntity, this.entities_array)
            thisEntity.setActionState(data.ActionType);
        });
    }
	
    //data contains actionType, fromHex, and toHex. We add entity to it in here
    doAction(unitIndex, data) {
        let performed = false
        data.entity = this.entities_array[unitIndex]
        if (this.current_actions > 0) {
            performed = data.entity.doAction(data)
        }
        if (performed) {
            console.log(performed)
            this.current_actions -= 1
            return performed
        }
        return false  
    }

    findServerEntity(entity, entities_array) {
        for (let Unit of entities_array){
            if (Unit.id === entity.id) {  //if the entity's ID matches the entity actually recognized as an entity's ID on the server...
                return Unit
            }
        } 
        return -1
    }

	setTurn(isTurn) {
        this.turn = isTurn;
        this.current_actions = this.base_actions;
		this.socket.emit('turnUpdate', { isTurn: this.turn }) //hides or displays end turn button
    }
	
    spawnUnit(entityType, x, y) {
        this.ID_count += 1
        const newUnit = new this.EntityMap[entityType](x, y, this.ID_count);
        newUnit.current_HP = newUnit.max_HP;
        newUnit.current_actions = newUnit.max_actions;
        this.addUnit(newUnit)
    }

	addUnit(unit) {	
		this.entities_array.push(unit)
	}
	
    clearUnits() {
        this.entities_array = [];
    }
	
	getUnitIfIsMine(fromHex) {
		for (var i in this.entities_array) {
            const unit = this.entities_array[i];
            if (fromHex && unit.coords.x == fromHex.col && unit.coords.y == fromHex.row) {
				return i;
            }
        }
		
		return -1;
	}

}

module.exports = { Player };