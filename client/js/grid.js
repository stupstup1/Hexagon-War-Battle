$(document).ready(function() {
	
    //-----------------------------------------------------------
    //GLOBALS + SHIT
    //-----------------------------------------------------------

    var canvas = document.getElementById("ctx");
    var ctx = canvas.getContext("2d");
	var canvas_units = document.getElementById("ctx_units");
	var ctx_units = canvas_units.getContext("2d");

    // Adjust canvas to fill window width and height
    canvas.width = window.innerWidth/1.01;
    canvas.height = window.innerHeight/1.1;
	canvas_units.width = window.innerWidth/1.01;
	canvas_units.height = window.innerHeight/1.1;

    // Dynamic size based on canvas width
    const radius = Math.floor(canvas.width / 40);  // Adjust size based on canvas width
    const hexWidth = 2 * radius;  // Width of a hexagon
    const hexHeight = Math.sqrt(3) * radius;  // Height of a hexagon

    // Offsets for grid positioning (tight horizontal layout)
    const xOffset = hexWidth - (0.5 * radius);  // Horizontal distance between hexagon centers, minus some trig to get them touching side-by-side;
    const yOffset = hexHeight; // Vertical distance between hexagon centers

    // board data
    const rows = 7;
    const cols = 15;
    const gridWidth = cols * xOffset;
    const gridHeight = rows * yOffset;
    const marginLeft = (canvas.width - gridWidth) / 2;
    const marginTop = (canvas.height - gridHeight) / 2;

    // Array to store hexagons for hover and click detection
    const hexagons = [];
    const icons = [];
    var zoomedIcon; //used to detect if we've moused over an action icon
    var clickedIcon; //used to detect if we've clicked an action icon
	var clickedHexagon; //used to detect if we've clicked a Hexagon
	var highlightedHexagon; //poorly named, but used to detect Hexagons we're currently mousing over
    const clickedColor = 'yellow';
	const highlightedColor = 'lightyellow';
	const highlightedColorCanMove = 'lightgreen';
    const highlightedColorCanAttack = '#FF6961';
	const defaultColor = 'lightblue';

    // Entity tracking
    var entities = [];
    let updateEntityData = {}
    
    //Actions tracking
    let currentAction = "";
    let drawPlayerInfoData = {}
	
    // Socket.IO setup
    var socket = window.socket; // Use the existing global socket

    //-----------------------------------------------------------
    //SERVER LISTENERS
    //-----------------------------------------------------------

    // Server initiated updating
    socket.on('serverUpdate', function(data){
        const { player1_entities, player2_entities, player_current_actions, player_base_actions, current_player_turn, player_current_food } = data;
        updateEntityData = { player1: player1_entities , player2: player2_entities }
        drawPlayerInfoData = { player_current_actions: player_current_actions, player_base_actions: player_base_actions, current_player_turn: current_player_turn, player_current_food: player_current_food }
		updateEntities(); // Redraw entities
        drawScreen();  // Redraw grid, but really just want to redraw player info. But doing it this way avoids some visual annoyances that we could theoretically fix			
    });

    //-----------------------------------------------------------
    //MAIN MOUSE LISTENERS
    //-----------------------------------------------------------

    // Mouse move listeners
    canvas_units.addEventListener('mousemove', (event) => {
        const previousZoomedIcon = zoomedIcon
        zoomedIcon = detectIcon(event)
		highlightedHexagon = detectHexagon(event);
		drawScreen();
        if (JSON.stringify(previousZoomedIcon) !== JSON.stringify(zoomedIcon)) {
            drawUnitInfo(); //display zoomed icon on mouseover
        }
    });
	
 	// Mouse click listeners
    canvas_units.addEventListener('click', (event) => {
        let updateClickedHexagon;
        let detectedHexagon = detectHexagon(event)

        const previousClickEntity = getEntityAtHex(clickedHexagon);
        const previousClickedHex = clickedHexagon;
		
        clickedIcon = detectIcon(event); //detects clicking on action icons
        if (clickedIcon) {
            onIconClicked(clickedIcon, previousClickEntity);
        }
        else if (currentAction === "Attack" && PLAYERNUMBER !== getPlayerKeyAtHex(detectedHexagon) && canReach(previousClickedHex, detectedHexagon, previousClickEntity.attack_rng, true)) {
            // when attacking and you click on an enemy do the attack, but don't update clicked hexagon
            performAction({fromEntity: previousClickEntity, toHex: detectedHexagon });
        }
        else {//Nesting clickedHexagon like this prevents deselecting units when clicking their actions
            clickedHexagon = detectedHexagon;
            updateClickedHexagon = true;
            if (!clickedHexagon) { //If we didn't click an icon nor a hexagon...
                drawUnitInfo() //clear action icons
            } 
        }

        if (clickedHexagon && updateClickedHexagon) { 
            onHexagonClicked(previousClickEntity, previousClickedHex);
        }        
		//update the fuckig screen
		drawScreen();
    });

    //-----------------------------------------------------------
    //"IF CLICKED" FUNCTIONS
    //-----------------------------------------------------------

    function onHexagonClicked(previousClickEntity, previousClickedHex) {
        const currentClickEntity = getEntityAtHex(clickedHexagon);
        if (currentClickEntity && ["Unit", "Leader"].includes(currentClickEntity.type) && !areHexesEqual(previousClickedHex,clickedHexagon)) {
            updateActionState("Move", currentClickEntity);
        }

        switch(currentAction)
        {
            case "Move":
                if (previousClickEntity && !currentClickEntity && canReach(previousClickedHex, clickedHexagon, previousClickEntity.movement_speed)) {
                    performAction({fromEntity: previousClickEntity, toHex: clickedHexagon });
                    return;
                }
                break;
            case "Attack":
                if (previousClickEntity && canReach(clickedHexagon, previousClickedHex, previousClickEntity.attack_rng, true)) {
                    console.log("attack");
                    performAction({fromEntity: previousClickEntity, toHex: clickedHexagon });
                    return;
                }
                break;
            default:
                break;
        }

        //Display actions to choose from
        drawUnitInfo();
    }

    function onIconClicked(clickedIcon, previousClickEntity) {
        updateActionState(clickedIcon.ActionType, previousClickEntity);
    }

    function updateActionState(actionType, selectedEntity)
    {
        socket.emit("updateActionState", {ActionType: actionType, SelectedEntity: selectedEntity})
        currentAction = actionType;
        drawUnitInfo(); //should update the icon to be green
    }

    //-----------------------------------------------------------
    //DRAWING FUNCTIONS
    //-----------------------------------------------------------

    // Draw a single hexagon
    function drawHexagon(col, row, radius) {
        // Calculate the center position of the hexagon
        const [x, y] = rowColToXandY(col, row);

        const angle = Math.PI / 3;  // 60 degrees
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
			//Draw Hexagon
            let angleOffset = angle * i;
            let xPos = x + radius * Math.cos(angleOffset);
            let yPos = y + radius * Math.sin(angleOffset);
            if (i === 0) ctx.moveTo(xPos, yPos);
            else ctx.lineTo(xPos, yPos);
		}
		
		const currentHex = { x, y, radius, col: col, row: row, id: `${row}-${col}` };
        ctx.closePath();
        ctx.fillStyle = defaultColor;  // Default color
		
		const clickedEntity = getEntityAtHex(clickedHexagon);
        if (clickedEntity) 
        {
            switch (currentAction)
            {
                case "Move":
                    if (PLAYERNUMBER === getPlayerKeyAtHex(clickedHexagon) && canReach(clickedHexagon,currentHex, clickedEntity.movement_speed))
                    {
				        ctx.fillStyle = highlightedColorCanMove;
                    }
                    break;
                case "Attack":
                    if (canReach(clickedHexagon,currentHex, clickedEntity.attack_rng, true))
                    {
                        ctx.fillStyle = highlightedColorCanAttack;
                    }
                    break;
                default:
                    break;
            }
		}
		
		if (clickedHexagon && clickedHexagon.x == x && clickedHexagon.y == y){
			ctx.fillStyle = clickedColor;  // Don't override clicked hexagon
		} else if (highlightedHexagon && highlightedHexagon.x == x && highlightedHexagon.y == y){
			ctx.fillStyle = highlightedColor;  // Don't override clicked hexagon
		}
        ctx.fill();
        ctx.stroke();

        return currentHex;
    }

    // Draw the entire hexagonal grid
    function drawScreen() {
        hexagons.length = 0;  // Clear previous hexagon data
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas

        // Loop through each row and column to draw hexagons
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Draw and store the hexagon
                hexagons.push(drawHexagon(col, row, radius));
            }
        }
        drawPlayerInfo(); //also draw Player Info
    }

    function drawPlayerInfo() { //Displays actions, food, and whose turn it is
        ctx.font = '20px Arial'; //I wanted to set the font at the top but it gets overwritten and I don't know why
        ctx.fillStyle = 'black';
		actionsRemaining = drawPlayerInfoData.player_current_actions;
        baseActions = drawPlayerInfoData.player_base_actions;
        playerName = drawPlayerInfoData.current_player_turn;
		ctx.fillText('Actions Remaining: ' + actionsRemaining + '/' + baseActions, 10, 30); // The numbers are the x and y coordinates
		food = drawPlayerInfoData.player_current_food;
		ctx.fillText("Food: " + food, 10, 70);
        ctx.fillText(playerName + ', Your Turn!', canvas.width/2.25, 30);
    }

    function updateEntities() {
        // clear entities
        entities = Array.from(Array(rows), () => new Array(cols));
        ctx_units.clearRect(canvas_units.width/10, 0, canvas_units.width, canvas_units.height);  // Clear canvas, not action icons
        
        // for each player
        for (let playerKey in updateEntityData) {
            const player = updateEntityData[playerKey];
            // for each player entity
            for (let i in player) {
                const entity = player[i];
                const entitySubtype = entity.subtype;
                const col = entity.coords.x;
                const row = entity.coords.y;
                // add to the global entities array
                entities[row][col] = [entitySubtype, playerKey, entity];

                // then draw the entity
                drawEntity(col, row, entitySubtype, playerKey);
            }
        }
        drawUnitInfo(); //redraw entity remaining actions
    }

    function drawEntity(col, row, entityToDraw, playerKey) {
        if (!entityToDraw) { return; }
		//If entityToDraw, draw entity

        // Calculate the center position of the hexagon
        const [x, y] = rowColToXandY(col, row);
        let entX = x - radius * 0.75;
        let entY = y - radius * 0.75;
        const img = new Image();
        img.src = 'img/' + playerKey + entityToDraw + '.png';
        img.onload = function() {
            ctx_units.drawImage(img, entX, entY, radius * 1.45, radius * 1.45);
        };
    }
	
	//Display actions to choose from if an entity is selected
	function drawUnitInfo() {
		let entity;
		ctx_units.clearRect(0, 0, canvas_units.width/10, canvas_units.height);  // Clear actions side of canvas, not units
		playerKey = getPlayerKeyAtHex(clickedHexagon)
        icons.length = 0;
		if (playerKey != PLAYERNUMBER) {return;} //quit if it's not ur unit
        if (clickedHexagon) {
			entity = getEntityAtHex(clickedHexagon)
        }
        if (!entity) { return; } //quit if no entity found

		//for each action type on the entity, draw the icon
		loopIteration = 0
        let unitfont_y = 0
        if (entity.actions) {
            for (let actionType of entity.actions.AllowedActions) {
                loopIteration += 1;
                let x = 10
                let y = (loopIteration * 80) + 10;
                unitfont_y = y
                let img_width = 75
                let img_length = 75
                const img = new Image();
                img.src = 'img/action' + actionType + '.png';
                if (zoomedIcon && zoomedIcon.ActionType.toLowerCase() == actionType.toLowerCase()) { //zoomedIcon
                    img_width = img_width * 1.25
                    img_length = img_length * 1.25
                }
                if (clickedIcon && clickedIcon.ActionType.toLowerCase() == actionType.toLowerCase()) { //clickedIcon
                    img.src = 'img/action' + actionType + 'Select.png';
                }
                img.onload = () => {
                    ctx_units.drawImage(img, x, y, img_width, img_length);
                };
                icons.push({ActionType: actionType, x: x, y: y, width: img_width, height: img_length});
            }
        }
        //display unit HP, add more stuff later
        ctx_units.font = '20px Arial'; //I wanted to set the font at the top but it gets overwritten and I don't know why
        ctx_units.fillStyle = 'black';
		ctx_units.fillText('HP: ' + entity.current_HP + '/' + entity.max_HP, 10, unitfont_y + 120);
        ctx_units.fillText('Unit Actions: ' + entity.current_actions + '/' + entity.max_actions, 10, unitfont_y + 160);
	}

    //-----------------------------------------------------------
    //MISC FUNCTIONS
    //-----------------------------------------------------------

    // Check if a point (mouse) is inside a hexagon
    function isPointInHexagon(px, py, hex) {
        const { x, y, radius } = hex;
        let inside = true;

        // Calculate distance from point to hexagon center
        const dx = px - x;
        const dy = py - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > radius) {
            inside = false;
        }

        return inside;
    }

    function isPointInIcon(px, py, icon) {
        const x = icon.x;
        const y = icon.y;
        const width = icon.width;
        const height = icon.height;

        if (px < x || px > x + width) {
            return false;
        }
        else if (py < y || py > y + height) {
            return false;
        }

        return true;
    }
	
	function detectHexagon(event) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        // Check which hexagon the mouse is over
        for (let hex of hexagons) {
            if (isPointInHexagon(mouseX, mouseY, hex)) {
                return hex;
            }
        }

        return null;
	}

    function detectIcon(event) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        for (let icon of icons) {
            if (isPointInIcon(mouseX, mouseY, icon)) {
                return icon;
            }
        }
		
		return null;
    }

    function getPlayerKeyAtHex(hex) {
		if (hex && entities[hex.row][hex.col])
		{
			return entities[hex.row][hex.col][1];
		}
    }

    function getEntityAtHex(hex) {
		if (hex && entities[hex.row][hex.col])
		{
			return entities[hex.row][hex.col][2];
		}
    }

    function rowColToXandY(col, row) {
        // Calculate the center position of the hexagon
        let x = marginLeft + col * xOffset;
        let y = marginTop + row * yOffset;

        // Adjust vertical placement to ensure the correct "touching" behavior for horizontal hexagons
        if (col % 2 === 1) {
            // Offset every other column (odd columns) vertically to achieve the "touching" effect
            y += hexHeight / 2;
        }

        return [x, y];
    }
	
	function areHexesEqual(hex1,hex2)
	{
		return JSON.stringify(hex1) === JSON.stringify(hex2);
	}
	
    //-----------------------------------------------------------
    //ACTION LOGIC
    //-----------------------------------------------------------
    
    function performAction(data) {
        
        socket.emit('performAction', data);
    }

	// Directions corresponding to the 6 possible moves in a hexagonal grid from an even column
	const EVEN_DIRECTIONS = [
		{ x: 0, y: -1 }, // North
		{ x: 1, y: -1 }, // North-East
		{ x: 1, y: 0 },  // South-East
		{ x: 0, y: 1 },  // South
		{ x: -1, y: 0 }, // South-West
		{ x: -1, y: -1 }, // North-West
	];
	
    // Directions corresponding to the 6 possible moves in a hexagonal grid from an odd column
	const ODD_DIRECTIONS = [
		{ x: 0, y: -1 }, // North
		{ x: 1, y: 0 }, // North-East
		{ x: 1, y: 1 },  // South-East
		{ x: 0, y: 1 },  // South
		{ x: -1, y: 1 }, // South-West
		{ x: -1, y: 0 }, // North-West
	];

	// Function to check if a position is valid (within bounds and not occupied)
	function isValid(x, y, ignoreUnits) {
		// Check if within grid bounds
		if (x < 0 || x >= cols || y < 0 || y >= rows) {
			return false;
		}
		
		// Check if tile is occupied
		if (entities[y][x] && !ignoreUnits) {
			return false;
		}
		
		return true;
	}

	// BFS function to determine if we can reach the destination
	function canReach(start, end, maxMoves, ignoreUnits) {
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
				directions = EVEN_DIRECTIONS
			} else {
				directions = ODD_DIRECTIONS
			}

			// Check all 6 possible directions
			for (const dir of directions) {
				const newX = current.col + dir.x;
				const newY = current.row + dir.y;
				
				// Only process valid and unvisited hexagons
				if (isValid(newX, newY, ignoreUnits) &&
					!visited.has(`${newX},${newY}`) &&
					current.moves + 1 <= maxMoves) {
					
					visited.add(`${newX},${newY}`);
					queue.push({ col: newX, row: newY, moves: current.moves + 1 });
				}
			}
		}
		return false; // No valid path found within maxMoves
	}
});


