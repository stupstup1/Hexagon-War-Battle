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
	const clickedColor = 'blue';
	var highlightedHexagon;
	const highlightedColor = 'yellow';
	const defaultColor = 'lightblue';

    // Entity tracking
    var entities = [];

    // Socket.IO setup
    var socket = window.socket; // Use the existing global socket

    socket.on('frameUpdate', function(playerData){
        drawHexagonalGrid();  // Redraw grid

        console.log(playerData);
        updateEntities(playerData);

        console.log(entities);

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
		drawHexagonalGrid();
    });
	
	// Mouse event listeners
    canvas_units.addEventListener('click', (event) => {
        const previousClickHadEntity = isEntityInHex(clickedHexagon);
        const previousClickedHex = clickedHexagon;
		clickedHexagon = detectHexagon(event);
        const currentClickHasEntity = isEntityInHex(clickedHexagon);

        if (previousClickHadEntity && !currentClickHasEntity) {
            moveEntity(previousClickedHex, clickedHexagon);
        }
		drawHexagonalGrid();
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
        let x = marginLeft + col * xOffset;
        let y = marginTop + row * yOffset;

        // Adjust vertical placement to ensure the correct "touching" behavior for horizontal hexagons
        if (col % 2 === 1) {
            // Offset every other column (odd columns) vertically to achieve the "touching" effect
            y += hexHeight / 2;
        }

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
        ctx.closePath();
		ctx.fillStyle = defaultColor;  // Default color
		if (clickedHexagon && clickedHexagon.x == x && clickedHexagon.y == y){
			ctx.fillStyle = clickedColor;  // Don't override clicked hexagon
		} else if (highlightedHexagon && highlightedHexagon.x == x && highlightedHexagon.y == y){
			ctx.fillStyle = highlightedColor;  // Don't override clicked hexagon
		}
        ctx.fill();
        ctx.stroke();

        return { x, y, radius, col: col, row: row, id: `${row}-${col}` };
    }

    // Draw the entire hexagonal grid
    function drawHexagonalGrid() {
        hexagons.length = 0;  // Clear previous hexagon data
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas

        // Loop through each row and column to draw hexagons
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Draw and store the hexagon
                hexagons.push(drawHexagon(col, row, radius));
            }
        }
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
        ctx_units.clearRect(0, 0, canvas_units.width, canvas_units.height);  // Clear canvas
        
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
                entities[row][col] = [entityType, playerKey];

                // then draw the entity
                drawEntity(col, row, entityType, playerKey);
            }
        }
    }

    function drawEntity(col, row, entityToDraw, playerKey) {
        if (!entityToDraw) { return; }
		//If entityToDraw, draw entity

        // Calculate the center position of the hexagon
        let x = marginLeft + col * xOffset;
        let y = marginTop + row * yOffset;
        let entX = x - radius + 5
        let entY = y - radius + 5
        const img = new Image();
        img.src = 'img/' + playerKey + entityToDraw + '.png';
        img.onload = function() {
            ctx_units.drawImage(img, entX, entY, 75, 75);
        };
    }

    function isEntityInHex(hex) {
        return hex && !!entities[hex.row][hex.col];
    }

    function moveEntity(fromHex, toHex) {
        socket.emit('moveEntity', {fromHex: fromHex, toHex: toHex});
    }
});
