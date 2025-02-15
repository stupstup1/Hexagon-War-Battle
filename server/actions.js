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

	actionTypes = ["","Move","Attack","Build","Spawn","GenerateFood","GenerateActions"];
	
	constructor(allowedActions, player) {
		this.AllowedActions = allowedActions;
		this.Player = player;
		return;
	}
	
    // actionData contains { maxCoords, turnPlayer, waitingPlayer} and information relevant to an action which may change based on the specific action.
	doAction(actionType, entity, actionData) {
		if (!actionType) {return;} //Quit if no data or if action is null
		if (this.actionTypes.indexOf(actionType) === -1 || actionType !== entity.action_state) {return;} //Quit if not a valid action or if action doesn't match entity.action_state
		
		if (!this.CanDoActionMap[actionType](actionData)) {return;} // Quit if we can not do the action

		actionData.entity = entity;
		let performed = this.DoActionMap[actionType](actionData);
		return performed
	}

	setActionState(actionType) {
		if (this.actionTypes.indexOf(actionType) === -1) { return; } //Quit if not a valid action
		if (this.AllowedActions.indexOf(actionType) === -1) { return; } // Quit if the action type is not available to the specific entity
		return actionType;
	}
	
	// move data contains: { maxCoords, turnPlayer, waitingPlayer, entity, toHex }
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

	// move data contains: { maxCoords, turnPlayer, waitingPlayer, toHex }
	CanMove(data) {
		const { maxCoords, turnPlayer, waitingPlayer, toHex} = data;

		if (toHex.col < 0 || toHex.col > maxCoords.x ||
			toHex.row < 0 || toHex.row > maxCoords.y) { return false; } // Quit if toHex is out of bounds
		if (turnPlayer.hasUnitOnHex(toHex) || waitingPlayer.hasUnitOnHex(toHex)) { return false; } // Quit if toHex is occupied
		return true;
	}

	CanAttack(data){
		console.log("We can attack!");
		return "Attack"
	}

	CanBuild(data){
		console.log("We can build!");
		return "Build"
	}

	CanSpawn(data){
		console.log("We can spawn!");
		return "Spawn"
	}

	CanGenerateFood(data){
		console.log("We can generate food!");
		return "GenerateFood"
	}

	CanGenerateActions(data){
		console.log("We can generate actions!");
		return "GenerateActions"
	}
}
