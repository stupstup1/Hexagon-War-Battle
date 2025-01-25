$(document).ready(function() {

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
	var clickedHexagon;
	const clickedColor = 'yellow';
	var highlightedHexagon;
	const highlightedColor = 'lightyellow';
	const highlightedColorCanMove = 'lightgreen';
	const defaultColor = 'lightblue';

    // Entity tracking
    var entities = [];
	
    // Socket.IO setup
    var socket = window.socket; // Use the existing global socket

    socket.on('frameUpdate', function(playerData){
		console.log(PLAYERNUMBER);
        updateEntities(playerData);
        drawScreen();  // Redraw grid

        // Redraw the hovered hexagon, if any
        if (hoveredHex) {
            highlightHexagon(hoveredHex);  // Highlight hovered hexagon
        }
					
    });

    // Mouse hover and click detection variables
    let hoveredHex = null;  // Track the hexagon being hovered over

    // Mouse event listeners
    canvas_units.addEventListener('mousemove', (event) => {
		highlightedHexagon = detectHexagon(event);
		drawScreen();
    });
	
 	// Mouse event listeners
	// We only want to redraw action icons if we don't move
    canvas_units.addEventListener('click', (event) => {
        const previousClickEntity = getEntityAtHex(clickedHexagon);
        const previousClickedHex = clickedHexagon;
		
		//selects a hexagon when clicking. If clicking previously selected hexagon, unselect it!
		clickedHexagon = detectHexagon(event);
		
 		//move action
        const currentClickEntity = getEntityAtHex(clickedHexagon);
        if (previousClickEntity && !currentClickEntity && canMove(previousClickedHex, clickedHexagon, previousClickEntity.movement_speed)) {
            moveEntity(previousClickedHex, clickedHexagon);
        } else
		{
			if (areHexesEqual(previousClickedHex,clickedHexagon)) {
				clickedHexagon = null
			}
			//Display actions to choose from
			drawActionIcons(clickedHexagon);
		}
		
		//update the fuckig screen
		drawScreen();
    }); 

    // Highlight a hexagon
    function highlightHexagon(hex, fillColor) {
        ctx.beginPath();
        ctx.moveTo(hex.x + radius, hex.y);  // Starting point
        for (let i = 1; i < 6; i++) {
            let angle = Math.PI / 3 * i;
            ctx.lineTo(hex.x + radius * Math.cos(angle), hex.y + radius * Math.sin(angle));
        }
        ctx.closePath();
		ctx.fillStyle = 'yellow';  // Highlighted color
        if (fillColor){
			ctx.fillStyle = fillColor
		}
        ctx.fill();
        ctx.stroke();
    }

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
		const clickedEntity = getEntityAtHex(clickedHexagon);
		if (clickedEntity && canMove(clickedHexagon,currentHex, clickedEntity.movement_speed)) {
				ctx.fillStyle = highlightedColorCanMove;
		} else {
			ctx.fillStyle = defaultColor;  // Default color
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
		
		//Display actions remaining and food
		ctx.font = '24px Arial';
		ctx.fillStyle = 'black';
		actionsRemaining = 3
		ctx.fillText('Remaining Actions: ' + actionsRemaining, 10, 30); // The numbers (10, 30) are the x and y coordinates
		food = 5
		ctx.fillText("Food: " + food, 10, 70); // The numbers (10, 30) are the x and y coordinates
    }

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
	
	function detectHexagon(event) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        hexagonOfInterest = null;  // Reset hovered hexagon on each move

        // Check which hexagon the mouse is over
        hexagons.forEach(hex => {
            if (isPointInHexagon(mouseX, mouseY, hex)) {
                hexagonOfInterest = hex;
            }
        });
		
		return hexagonOfInterest;
	}

    function updateEntities(playerData) {
        // clear entities
        entities = Array.from(Array(rows), () => new Array(cols));
        ctx_units.clearRect(canvas_units.width/15, 0, canvas_units.width, canvas_units.height);  // Clear canvas, not action icons
        
        // for each player
        for (let playerKey in playerData) {
            const player = playerData[playerKey];
            // for each player entity
            for (let i in player) {
                const entity = player[i];
                const entityType = entity.type;
                const col = entity.coords.x;
                const row = entity.coords.y;
                // add to the entities array
                entities[row][col] = [entityType, playerKey, entity];

                // then draw the entity
                drawEntity(col, row, entityType, playerKey);
            }
        }
    }

    function drawEntity(col, row, entityToDraw, playerKey) {
        if (!entityToDraw) { return; }
		//If entityToDraw, draw entity

        // Calculate the center position of the hexagon
        const [x, y] = rowColToXandY(col, row);
        let entX = x - radius + 5
        let entY = y - radius + 5
        const img = new Image();
        img.src = 'img/' + playerKey + entityToDraw + '.png';
        img.onload = function() {
            ctx_units.drawImage(img, entX, entY, 75, 75);
        };
    }
	
	//Display actions to choose from if an entity is selected
	function drawActionIcons(clickedHexagon) {
		let entity;
		ctx_units.clearRect(0, 0, canvas_units.width/15, canvas_units.height);  // Clear actions side of canvas, not units
		
        if (clickedHexagon) {
			entity = getEntityAtHex(clickedHexagon)
        }
        if (!entity) { return; } //quit if no entity found
		
		//for each action type on the entity, draw the icon
		loopIteration = 0
		for (let actionType of entity.action_array) {
			// Calculate the Y position
			loopIteration += 1;
			let y = (loopIteration * 80) + 10;
			// Create a new Image and return a Promise that resolves when the image is loaded
			const img = new Image();
			img.src = 'img/action' + actionType + '.png';
			img.onload = () => {
				ctx_units.drawImage(img, 10, y, 75, 75);
			};
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
	
	/////MOVEMENT LOGIC
	function moveEntity(fromHex, toHex) {
		socket.emit('moveEntity', { fromHex: fromHex, toHex: toHex });
	}

	// Directions corresponding to the 6 possible moves in a hexagonal grid
	const EVEN_DIRECTIONS = [
		{ x: 0, y: -1 }, // North
		{ x: 1, y: -1 }, // North-East
		{ x: 1, y: 0 },  // South-East
		{ x: 0, y: 1 },  // South
		{ x: -1, y: 0 }, // South-West
		{ x: -1, y: -1 }, // North-West
	];
	
	const ODD_DIRECTIONS = [
		{ x: 0, y: -1 }, // North
		{ x: 1, y: 0 }, // North-East
		{ x: 1, y: 1 },  // South-East
		{ x: 0, y: 1 },  // South
		{ x: -1, y: 1 }, // South-West
		{ x: -1, y: 0 }, // North-West
	];

	// Function to check if a position is valid (within bounds and not occupied)
	function isValid(x, y) {
		// Check if within grid bounds
		if (x < 0 || x >= cols || y < 0 || y >= rows) {
			return false;
		}
		
		// Check if tile is occupied
		if (entities[y][x]) {
			return false;
		}
		
		return true;
	}

	// BFS function to determine if we can reach the destination
	function canMove(start, end, maxMoves) {
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
				if (isValid(newX, newY) &&
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


