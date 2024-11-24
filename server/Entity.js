class Entity {
    constructor() {
        this.id = "";
    }

class Unit extends Entity {
    constructor(id) {
        super();
        this.id = id;
    }
	
class Building extends Entity {
    constructor(id) {
        super();
        this.id = id;
    }
	
class Leader extends Entity {
    constructor(id) {
        super();
        this.id = id;
    }

module.exports = { Entity, Unit, Building, Leader };
