import { Action } from './actions.js';

export class Entity {
    constructor(x, y, id) {
		this.id = id;
		this.actions = new Action([]);
		this.max_actions = 0;
		this.current_actions = 0; //current_actions is set in spawnUnit in Player.js
		this.action_state = "";
		this.max_HP = 0;
		this.current_HP = 0; //current_HP is set in spawnUnit in Player.js
		this.attack_dmg = 0;
		this.attack_rng = 0;
		this.movement_speed = 0;
		this.coords = { 
			x:x, 
			y:y 
		};
		this.type = "";
		this.subtype = "";
		this.cost = 0;
		this.foodAdded = 0;
    }
	
    // actionData contains { maxCoords, turnPlayer, waitingPlayer} and information relevant to an action which may change based on the specific action.
	doAction(actionData) {
		let performed = false

		if (this.current_actions > 0) {
			performed = this.actions.doAction(this.action_state, this, actionData)
		}
        if (performed) {
            this.current_actions -= 1
            return performed
        }
        return false
	}

	setActionState(actionType) {
		this.action_state = this.actions.setActionState(actionType);
	}

	moveEntity(toHex) {
		this.coords = {
			x: toHex.col,
			y: toHex.row
		};
	}

	replenishActions() {
		this.current_actions = this.max_actions;
	}
}

export class Unit extends Entity {
    constructor(x, y, id) {
        super(x, y, id);
		this.actions = new Action(["Move", "Attack"]);
		this.max_actions = 2;
		this.type = "Unit"
    }
}

export class Swordfighter extends Unit {
    constructor(x, y, id) {
        super(x, y, id);
		this.max_HP = 3;
		this.attack_dmg = 2;
		this.attack_rng = 1;
		this.movement_speed = 1;
		this.subtype = "Swordfighter"
		this.cost = 2
    }
}

export class Archer extends Unit {
    constructor(x, y, id) {
        super(x, y, id);
		this.max_HP = 2;
		this.attack_dmg = 2;
		this.attack_rng = 2;
		this.movement_speed = 1;
		this.subtype = "Archer"
		this.cost = 3
    }
}

export class Cavalier extends Unit {
    constructor(x, y, id) {
        super(x, y, id);
		this.max_HP = 5;
		this.attack_dmg = 2;
		this.attack_rng = 1;
		this.movement_speed = 2;
		this.subtype = "Cavalier"
		this.cost = 6
    }
}

export class Catapult extends Unit {
    constructor(x, y, id) {
        super(x, y, id);
		this.max_actions = 1;
		this.max_HP = 7;
		this.attack_dmg = 3; //but automatically destroys buildings
		this.attack_rng = 4;
		this.movement_speed = 1;
		this.subtype = "Catapult"
		this.cost = 8
    }
}

export class Building extends Entity {
    constructor(x, y, id) {
        super(x, y, id);
		this.movement_speed = 0;
		this.type = "Building"
    }
}

export class Farm extends Building {
    constructor(x, y, id) {
        super(x, y, id);
		this.action_array = [];
		this.max_actions = 0;
		this.max_HP = 5;
		this.subtype = "Farm"
		this.cost = 5
		this.foodAdded = 2;
    }
}

export class Barracks extends Building {
    constructor(x, y, id) {
        super(x, y, id);
		this.actions = new Action(["Spawn"]);
		this.max_actions = 1;
		this.max_HP = 5;
		this.subtype = "Barracks"
		this.cost = 5
    }
}

export class Leader extends Entity {
    constructor(x, y, id) {
        super(x, y, id);
		this.actions = new Action(["Move", "Attack", "Build"]);

		this.max_actions = 3;
		this.max_HP = 9;
		this.attack_dmg = 2;
		this.attack_rng = 1;
		this.movement_speed = 2;	
		this.type = "Leader"
		this.subtype = "Leader"
    }
}
