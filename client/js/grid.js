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

    // Limit to a 7x7 grid
    const rows = 7;
    const cols = 15;

    // Array to store hexagons for hover and click detection
    const hexagons = [];
	var clickedHexagon;
	const clickedColor = 'blue';
	var highlightedHexagon;
	const highlightedColor = 'yellow';
	const defaultColor = 'lightblue';

    // Socket.IO setup
    var socket = window.socket; // Use the existing global socket

    socket.on('frameUpdate', function(data){
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas
        drawHexagonalGrid(data);  // Redraw grid

		console.log(data)

        // Redraw the hovered hexagon, if any
        if (hoveredHex) {
            highlightHexagon(hoveredHex);  // Highlight hovered hexagon
        }
    });

    // Mouse hover and click detection variables
    let hoveredHex = null;  // Track the hexagon being hovered over

    // Mouse event listeners
    canvas_units.addEventListener('mousemove', (event) => {
		highlightedHexagon = detectHexagon(event, 'yellow');
		drawHexagonalGrid();
    });
	
	// Mouse event listeners
    canvas_units.addEventListener('click', (event) => {
		clickedHexagon = detectHexagon(event, clickedColor);
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
    function drawHexagon(x, y, radius, entityToDraw, playerNumber) {
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
		
		//If entityToDraw, draw entity
		if (entityToDraw) {
			let entX = x - radius + 5
			let entY = y - radius + 5
			const img = new Image();
			img.src = 'img/' + playerNumber + entityToDraw + '.png';
			img.onload = function() {
				ctx_units.drawImage(img, entX, entY, 75, 75);
				ctx_units.clearRect();
			};
        }
    }

    // Draw the entire hexagonal grid
    function drawHexagonalGrid(data) {
        hexagons.length = 0;  // Clear previous hexagon data

        // Calculate the total width and height of the grid
        const gridWidth = cols * xOffset;
        const gridHeight = rows * yOffset;

        // Calculate margins to center the grid
        const marginLeft = (canvas.width - gridWidth) / 2;
        const marginTop = (canvas.height - gridHeight) / 2;

        // Loop through each row and column to draw hexagons
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Calculate the center position of the hexagon
                let x = marginLeft + col * xOffset;
                let y = marginTop + row * yOffset;

                // Adjust vertical placement to ensure the correct "touching" behavior for horizontal hexagons
                if (col % 2 === 1) {
                    // Offset every other column (odd columns) vertically to achieve the "touching" effect
                    y += hexHeight / 2;
                }

				let entityToDraw;
				let playerNumber;
				let found;
				
				// Detect if there's an entity at these coordinates
				for (let playerKey in data) {
				  let player = data[playerKey];
				  // Loop through each entity of the player
				  for (let i in player) {
					let entity = player[i];
					// Check if the entity's coords match the target (x, y)
					if (entity.coords.x === col && entity.coords.y === row) {
						entityToDraw = entity.type;
						playerNumber = playerKey;
						break;  // Exit the loop once a match is found
					}
				  }

				  if (found) {
					break;  // Exit the player loop if we already found a match
				  }
				}
				
                // Draw the hexagon
                drawHexagon(x, y, radius, entityToDraw, playerNumber);

                // Store hexagon data (x, y position, and unique id)
                hexagons.push({ x, y, radius, id: `${row}-${col}` });
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
	
	function detectHexagon(event, fillColor) {
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

});
