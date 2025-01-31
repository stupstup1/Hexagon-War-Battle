$(document).ready(function() {

	//Shared global so other .js files can access the 'doAction' function
	//to access from other files, call Actions.doAction(x,y,z)
	window.Actions = window.Actions || {};

	//list of action types
	let actionTypes = ["Move","Attack","Build","Spawn","GenerateFood","GenerateActions"]

	//all actions go through this function first
	Actions.doAction = function doAction(playerData, actionType, fromHex, toHex) {
		if (!actionType.indexOf(actionTypes) || !playerData) {return}
		return 1
	}

	function Move(){
		return 1
	}

	function Attack(){
		return 1
	}

	function Build(){
		return 1
	}

	function Spawn(){
		return 1
	}

	function GenerateFood(){
		return 1
	}

	function GenerateActions(){
		return 1
	}
	
});
