// Import the Entity class
import { Leader, Farm, Barracks, Swordfighter, Archer, Cavalier, Catapult } from './Entity.js';

export class Player {
    constructor(socket) {
        this.socket = socket;
        this.name = '';
		this.playerNumber = 0;
        this.turn = false;  // Indicates if it's the player's turn
		this.entities_array = [];
        this.entityIndexWithActionState = -1;
        this.current_actions = 0;
		this.base_actions = 3
        this.EntityMap = {
            Leader: Leader,
            Swordfighter: Swordfighter,
            Archer: Archer,
            Cavalier: Cavalier,
            Catapult: Catapult,
            Barracks: Barracks,
            Farm: Farm
        }
        this.currentFood = 5;

        socket.on("updateActionState", (data) => {
            if (!data.SelectedEntity) {return; }
            let [thisEntity, entityIndex] = this.findServerEntity(data.SelectedEntity);

            if (entityIndex >= 0) {
                this.clearServerEntityActionStates();

                thisEntity.setActionState(data.ActionType);
                this.entityIndexWithActionState = entityIndex;
            }
        });
    }
	
    // actionData contains { maxCoords, turnPlayer, waitingPlayer, fromEntity, toHex} and information relevant to an action which may change based on the specific action.
    doAction(actionData) {
        let performed = false;

        // early exit if entity with action is no longer available to the player (example: if the entity was killed)
        if (this.entityIndexWithActionState < 0 || this.entityIndexWithActionState >= this.entities_array.length) {
            this.entityIndexWithActionState = -1;
            return false;
        }

        const entityWithAction = this.entities_array[this.entityIndexWithActionState];
        const [clientClickedEntity, clientClickedEntityIndex]  = this.findServerEntity(actionData.fromEntity);
        if (this.current_actions > 0 // has enough actions
            && clientClickedEntityIndex !== -1 && entityWithAction.id === clientClickedEntity.id) // action is being performed on the right unit
        {
            performed = entityWithAction.doAction(actionData);
        }
        if (performed) {
            this.current_actions -= 1
            return true;
        }
        return false  
    }

    // clears all action states on a user. ran in preperation of setting another entities action
    //  so that only one entity has an action state per user at a time
    clearServerEntityActionStates() {
        for (let entity of this.entities_array){
            entity.setActionState("");
        }
        this.entityIndexWithActionState = -1;
    }

    findServerEntity(entity) {
        for (var i in this.entities_array){
            const unit = this.entities_array[i];
            if (unit.coords.x == entity.coords.x && unit.coords.y == entity.coords.y) {  //if the entity's ID matches the entity actually recognized as an entity's ID on the server...
                return [unit, i];
            }
        } 
        return [{}, -1];
    }

	setTurn(isTurn) { 
        this.turn = isTurn;
        this.current_actions = this.base_actions; //replenish player actions
		this.socket.emit('turnUpdate', { isTurn: this.turn }) //hides or displays end turn button
        this.clearServerEntityActionStates();
        for (let entity of this.entities_array) {
            entity.replenishActions()
        }
    }
	
    spawnUnit(entityType, x, y, forFree) {
        const newUnit = new this.EntityMap[entityType](x, y, this);
        newUnit.current_HP = newUnit.max_HP;
        newUnit.current_actions = newUnit.max_actions;
        this.addUnit(newUnit)
        if (!forFree) {
            this.addFood(newUnit.cost * -1);
        }
    }

	addUnit(unit) {	
		this.entities_array.push(unit)
	}
	
    clearUnits() {
        this.entities_array = [];
    }
	
	hasUnitOnHex(targetHex) {
		for (let entity of this.entities_array) {
            if (targetHex && entity.coords.x === targetHex.col && entity.coords.y === targetHex.row) {
				return true;
            }
        }
		
		return false;
	}

    calculateEndOfTurnFood() {
        let endOfTurnFood = 0;

        for (let entity of this.entities_array) {
            endOfTurnFood += entity.foodAdded;
        }

        return endOfTurnFood;
    }

    addFood(foodCount) {
        this.currentFood += foodCount;
    }

    attackEntityOnHex(attackingEntity, targetHex)
    {
        for (var i in this.entities_array) {
            const attackedUnit = this.entities_array[i];
            if (targetHex && attackedUnit.coords.x == targetHex.col && attackedUnit.coords.y == targetHex.row) {
                const remainingHealth = attackedUnit.current_HP - attackingEntity.attack_dmg;

                if (remainingHealth > 0)
                {
                    this.entities_array[i].current_HP = remainingHealth;
                } else {
                    this.entities_array.splice(i , 1);
                }

                return;
            }
        }
    }

}