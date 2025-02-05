export class Action {
	ActionMap = {
		Move: this.Move,
		Attack: this.Attack,
		Build: this.Build,
		Spawn: this.Spawn,
		GenerateFood: this.GenerateFood
	}
	Player;
	AllowedActions;

	actionTypes = ["Move","Attack","Build","Spawn","GenerateFood","GenerateActions"]
	
	constructor(allowedActions, player) {
		this.AllowedActions = allowedActions;
		this.Player = player;
		return;
	}
	

	doAction(actionType) {
		if (!actionType.indexOf(this.actionTypes)) {return;} //Quit if not a valid action
		this.ActionMap[actionType](); //Call the action's function
		return 1
	}
	
	Move() {
		console.log("We moved!");
		return 1
	}

	Attack(){
		console.log("We Attack!");
		return 1
	}

	Build(){
		console.log("We Build!");
		return 1
	}

	Spawn(){
		console.log("We Spawn!");
		return 1
	}

	GenerateFood(){
		return 1
	}
}
