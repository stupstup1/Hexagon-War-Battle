export class Action {
	DoActionMap = { //these functions are for performing an action
		Move: this.Move,
		Attack: this.Attack,
		Build: this.Build,
		Spawn: this.Spawn,
		GenerateFood: this.GenerateFood,
		GenerateActions: this.GenerateActions
	}
	CanDoActionMap = { //these functions are for editing an entity's action state
		Move: this.CanMove,
		Attack: this.CanAttack,
		Build: this.CanBuild,
		Spawn: this.CanSpawn,
		GenerateFood: this.CanGenerateFood,
		GenerateActions: this.CanGenerateActions
	}
	Player;
	AllowedActions;

	actionTypes = ["Move","Attack","Build","Spawn","GenerateFood","GenerateActions"]
	
	constructor(allowedActions, player) {
		this.AllowedActions = allowedActions;
		this.Player = player;
		return;
	}
	
	//data contains entity, actionType, fromHex, and toHex
	doAction(data) {
		if (!data  || !data.actionType) {return;} //Quit if no data or if action is null
		if (!data.actionType.indexOf(this.actionTypes) || data.actionType !== data.entity.action_state) {return;} //Quit if not a valid action or if action doesn't match entity.action_state
		let performed = this.DoActionMap[data.actionType](data);
		return performed
	}

	setActionState(actionType) {
		if (!actionType.indexOf(this.actionTypes)) {return;} //Quit if not a valid action
		let action_state = this.CanDoActionMap[actionType](); //set the action_state variable by calling the appropriate function
		return action_state
	}
	
	Move(data) {
		data.entity.coords = {
			x: data.toHex.col,
			y: data.toHex.row
		};
		return true
	}

	Attack(data){
		return true
	}

	Build(data){
		return true
	}

	Spawn(data){
		return true
	}

	GenerateFood(data){
		return true
	}

	GenerateActions(data){
		return true
	}

	CanMove() {
		console.log("We can move!");
		return "Move"
	}

	CanAttack(){
		console.log("We can attack!");
		return "Attack"
	}

	CanBuild(){
		console.log("We can build!");
		return "Build"
	}

	CanSpawn(){
		console.log("We can spawn!");
		return "Spawn"
	}

	CanGenerateFood(){
		console.log("We can generate food!");
		return "GenerateFood"
	}

	CanGenerateActions(){
		console.log("We can generate actions!");
		return "GenerateActions"
	}
}
