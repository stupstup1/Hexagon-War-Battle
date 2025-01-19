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
    }
	
	compressData
	
	create
}

class Unit extends Entity {
    constructor(x, y) {
        super(x, y);
    }
}

class Building extends Entity {
    constructor(x, y) {
        super(x, y);
    }
}

class Leader extends Entity {
    constructor(x, y) {
        super(x, y);
		this.action_array = [ "move", "attack", "build" ];
		this.action_cap = 3;
		this.HP = 5;
		this.attack_dmg = 2;
		this.attack_rng = 1;
		this.movement_speed = 2;	
		this.type = "Leader"
    }
}

module.exports = { Entity, Unit, Building, Leader };
