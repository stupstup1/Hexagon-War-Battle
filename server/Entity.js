const { Action } = require('./actions');

class Entity {
    constructor(x, y, id) {
		this.id = id;
		this.actions;
		this.max_actions = 0;
		this.current_actions = 0; //current_actions is set in spawnUnit in Player.js
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
		this.cost = 0
    }

	doAction(actionType) {
		this.actions.doAction(actionType);
	}
}

class Unit extends Entity {
    constructor(x, y, id) {
        super(x, y, id);
		this.actions = new Action(["Move", "Attack"]);
		this.max_actions = 2;
    }
}

class Swordfighter extends Unit {
    constructor(x, y, id) {
        super(x, y, id);
		this.max_HP = 3;
		this.attack_dmg = 2;
		this.attack_rng = 1;
		this.movement_speed = 1;
		this.type = "Swordfighter"
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
		this.type = "Archer"
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
		this.type = "Cavalier"
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
		this.type = "Catapult"
		this.cost = 8
    }
}

class Building extends Entity {
    constructor(x, y, id) {
        super(x, y, id);
		this.movement_speed = 0;
    }
}

class Farm extends Building {
    constructor(x, y, id) {
        super(x, y, id);
		this.action_array = [];
		this.max_actions = 0;
		this.max_HP = 5;
		this.type = "Farm"
		this.cost = 5
    }
}

class Barracks extends Building {
    constructor(x, y, id) {
        super(x, y, id);
		this.actions = new Action(["Spawn"]);
		this.max_actions = 1;
		this.max_HP = 5;
		this.type = "Barracks"
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
    }
}

module.exports = { Entity, Unit, Building, Leader, Farm, Barracks, Swordfighter, Archer, Cavalier, Catapult };
