class Entity {
    constructor(x, y) {
		this.action_array = {}
		this.action_cap = 0;
		this.HP = 0;
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
}

class Unit extends Entity {
    constructor(x, y) {
        super(x, y);
		this.action_array = [ "move", "attack" ];
		this.action_cap = 2;
    }
}

class Swordfighter extends Unit {
    constructor(x, y) {
        super(x, y);
		this.HP = 3;
		this.attack_dmg = 2;
		this.attack_rng = 1;
		this.movement_speed = 1;
		this.type = "Swordfighter"
		this.cost = 2
    }
}

class Archer extends Unit {
    constructor(x, y) {
        super(x, y);
		this.HP = 2;
		this.attack_dmg = 2;
		this.attack_rng = 2;
		this.movement_speed = 1;
		this.type = "Archer"
		this.cost = 3
    }
}

class Cavalier extends Unit {
    constructor(x, y) {
        super(x, y);
		this.HP = 5;
		this.attack_dmg = 2;
		this.attack_rng = 1;
		this.movement_speed = 2;
		this.type = "Cavalier"
		this.cost = 6
    }
}

class Catapult extends Unit {
    constructor(x, y) {
        super(x, y);
		this.action_cap = 1;
		this.HP = 7;
		this.attack_dmg = 3; //but automatically destroys buildings
		this.attack_rng = 4;
		this.movement_speed = 1;
		this.type = "Catapult"
		this.cost = 8
    }
}

class Building extends Entity {
    constructor(x, y) {
        super(x, y);
		this.movement_speed = 0;
    }
}

class Farm extends Building {
    constructor(x, y) {
        super(x, y);
		this.action_array = [];
		this.action_cap = 0;
		this.HP = 5;
		this.type = "Farm"
		this.cost = 5
    }
}

class Barracks extends Building {
    constructor(x, y) {
        super(x, y);
		this.action_array = [ "spawn" ];
		this.action_cap = 1;
		this.HP = 5;
		this.type = "Barracks"
		this.cost = 5
    }
}

class Leader extends Entity {
    constructor(x, y) {
        super(x, y);
		this.action_array = [ "move", "attack", "build" ];
		this.action_cap = 3;
		this.HP = 9;
		this.attack_dmg = 2;
		this.attack_rng = 1;
		this.movement_speed = 2;	
		this.type = "Leader"
    }
}

module.exports = { Entity, Unit, Building, Leader, Farm, Barracks, Swordfighter, Archer, Cavalier, Catapult };
