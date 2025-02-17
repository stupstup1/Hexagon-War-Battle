export class Action {
	DoActionMap = { //these functions are for performing an action
		Move: this.Move.bind(this),
		Attack: this.Attack.bind(this),
		Build: this.Spawn.bind(this),
		Spawn: this.Spawn.bind(this),
		GenerateActions: this.GenerateActions.bind(this)
	}
	CanDoActionMap = { //these functions are for editing an entity's action state
		Move: this.CanMove.bind(this),
		Attack: this.CanAttack.bind(this),
		Build: this.CanSpawn.bind(this),
		Spawn: this.CanSpawn.bind(this),
		GenerateActions: this.CanGenerateActions.bind(this)
	}
	Player;
	AllowedActions;

	actionTypes = ["","Move","Attack","Build","Spawn","GenerateActions"];
	
	constructor(allowedActions) {
		this.AllowedActions = allowedActions;
		return;
	}
	
    // actionData contains { maxCoords, turnPlayer, waitingPlayer} and information relevant to an action which may change based on the specific action.
	doAction(actionType, entity, actionData) {
		if (!actionType) {return;} //Quit if no data or if action is null
		if (this.actionTypes.indexOf(actionType) === -1 || actionType !== entity.action_state) {return;} //Quit if not a valid action or if action doesn't match entity.action_state
		
		if (!this.CanDoActionMap[actionType](actionData)) { return; } // Quit if we can not do the action

		actionData.entity = entity;
		let performed = this.DoActionMap[actionType](actionData);
		return performed
	}

	setActionState(actionType) {
		if (this.actionTypes.indexOf(actionType) === -1) { return; } //Quit if not a valid action
		if (this.AllowedActions.indexOf(actionType) === -1) { return; } // Quit if the action type is not available to the specific entity
		return actionType;
	}
	
	// move data contains: { maxCoords, turnPlayer, waitingPlayer, fromEntity, toHex }
	Move(data) {
		data.entity.coords = {
			x: data.toHex.col,
			y: data.toHex.row
		};
		return true
	}
	
	// move data contains: { maxCoords, turnPlayer, waitingPlayer, fromEntity, toHex }
	Attack(data){
		const { waitingPlayer, fromEntity, toHex } = data;

		waitingPlayer.attackEntityOnHex(fromEntity, toHex);
		return true;
	}

	// build data contains: {turnPlayer, waitingPlayer, newEntityType, toHex}
	Spawn(data) {
		data.turnPlayer.spawnUnit(data.newEntityType, data.toHex.col, data.toHex.row);
		return true;
	}

	GenerateActions(data){
		return true
	}

	// move data contains: { maxCoords, turnPlayer, waitingPlayer, fromEntity, toHex }
	CanMove(data) {

		if (!this.canReach(data, data.fromEntity.movement_speed, false)) { return false; }
		return true;
	}

	// move data contains: { maxCoords, turnPlayer, waitingPlayer, fromEntity, toHex }
	CanAttack(data){
		const { maxCoords, waitingPlayer, toHex} = data;

		if (toHex.col < 0 || toHex.col > maxCoords.x ||
			toHex.row < 0 || toHex.row > maxCoords.y) { console.log("max"); return false; } // Quit if toHex is out of bounds
		if (!waitingPlayer.hasUnitOnHex(toHex)) { return false; } // Quit if toHex does not have an enemy unit
		return true;
	}

	CanSpawn(data) {

		if (!this.canReach(data, data.fromEntity.spawnRange, false)) { return false; }
		// TODO: Validate that passed in newEntityType is allowed to be built by current entity
		return true;
	}

	CanGenerateActions(data){
		console.log("We can generate actions!");
		return "GenerateActions"
	}

	// Directions corresponding to the 6 possible moves in a hexagonal grid from an even column
	EVEN_DIRECTIONS = [
		{ x: 0, y: -1 }, // North
		{ x: 1, y: -1 }, // North-East
		{ x: 1, y: 0 },  // South-East
		{ x: 0, y: 1 },  // South
		{ x: -1, y: 0 }, // South-West
		{ x: -1, y: -1 }, // North-West
	];
	
	// Directions corresponding to the 6 possible moves in a hexagonal grid from an odd column
	ODD_DIRECTIONS = [
		{ x: 0, y: -1 }, // North
		{ x: 1, y: 0 }, // North-East
		{ x: 1, y: 1 },  // South-East
		{ x: 0, y: 1 },  // South
		{ x: -1, y: 1 }, // South-West
		{ x: -1, y: 0 }, // North-West
	];
	
	// Function to check if a position is valid (within bounds and not occupied)
	isValid(x, y, ignoreUnits, turnPlayer, waitingPlayer) {
		const rows = 7;
		const cols = 15; // These numbers were ripped from grid.js. Long term, we should define information like this globally on the server and send to client
		                 // on initialize.

		// Check if within grid bounds
		if (x < 0 || x >= cols || y < 0 || y >= rows) {
			return false;
		}
		
		// Check if tile is occupied
		if (!ignoreUnits) {
			if (turnPlayer.hasUnitOnHex({col: x, row: y})) { return false; }
			if (waitingPlayer.hasUnitOnHex({col: x, row: y})) { return false; }
		}
		
		return true;
	}
	
	// BFS function to determine if we can reach the destination
	canReach(data, maxMoves, ignoreUnits) {

		const start = {col: data.fromEntity.coords.x, row: data.fromEntity.coords.y};;
		const end = data.toHex;
		
		const queue = [{ ...start, moves: 0 }];
		const visited = new Set();
		visited.add(`${start.col},${start.row}`);

		while (queue.length > 0) {
			const current = queue.shift();

			// If we have reached the destination
			if (current.col === end.col && current.row === end.row) {
				return current.moves <= maxMoves;
			}
			
			let directions
			if (current.col % 2 === 0){
				directions = this.EVEN_DIRECTIONS
			} else {
				directions = this.ODD_DIRECTIONS
			}

			// Check all 6 possible directions
			for (const dir of directions) {
				const newX = current.col + dir.x;
				const newY = current.row + dir.y;
				
				// Only process valid and unvisited hexagons
				if (this.isValid(newX, newY, ignoreUnits, data.turnPlayer, data.waitingPlayer) &&
					!visited.has(`${newX},${newY}`) &&
					current.moves + 1 <= maxMoves) {
					
					visited.add(`${newX},${newY}`);
					queue.push({ col: newX, row: newY, moves: current.moves + 1 });
				}
			}
		}
		return false; // No valid path found within maxMoves
	}
}
