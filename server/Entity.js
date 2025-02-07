const { Action } = require('./actions');

class Entity {
    constructor(x, y, id) {
		this.id = id;
		this.actions;
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
		}
		this.type = ""
		this.subtype = ""
		this.cost = 0
    }
	//data contains entity, actionType, fromHex, and toHex
	doAction(data) {
		let performed = this.actions.doAction(data)
        if (performed) {
            this.current_actions -= 1
            return performed
        }
        return -1   
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
}

class Unit extends Entity {
    constructor(x, y, id) {
        super(x, y, id);
		this.actions = new Action(["Move", "Attack"]);
		this.max_actions = 2;
		this.type = "Unit"
    }
}

class Swordfighter extends Unit {
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

class Archer extends Unit {
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

class Cavalier extends Unit {
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

class Catapult extends Unit {
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

class Building extends Entity {
    constructor(x, y, id) {
        super(x, y, id);
		this.movement_speed = 0;
		this.type = "Building"
    }
}

class Farm extends Building {
    constructor(x, y, id) {
        super(x, y, id);
		this.action_array = [];
		this.max_actions = 0;
		this.max_HP = 5;
		this.subtype = "Farm"
		this.cost = 5
    }
}

class Barracks extends Building {
    constructor(x, y, id) {
        super(x, y, id);
		this.actions = new Action(["Spawn"]);
		this.max_actions = 1;
		this.max_HP = 5;
		this.subtype = "Barracks"
		this.cost = 5
    }
}

class Leader extends Entity {
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

module.exports = { Entity, Unit, Building, Leader, Farm, Barracks, Swordfighter, Archer, Cavalier, Catapult };
