$(document).ready(function() {
	
	var canvas = document.getElementById("ctx");
	var ctx = canvas.getContext("2d");


	// Adjust canvas to fill window width and height
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Dynamic size based on canvas width
	const radius = Math.floor(canvas.width / 40);  // Adjust size based on canvas width
	const hexWidth = 2 * radius;  // Width of a hexagon
	const hexHeight = Math.sqrt(3) * radius;  // Height of a hexagon

	// Offsets for grid positioning (tight horizontal layout)
	const xOffset = hexWidth - (0.5 * radius);  // Horizontal distance between hexagon centers, minus some trig to get them touching side-by-side;
	const yOffset = hexHeight; // Vertical distance between hexagon centers

	// Limit to a 7x7 grid
	const rows = 7;
	const cols = 7;

	// Array to store hexagons for hover and click detection
	const hexagons = [];

	// Socket.IO setup
	var socket = io();

	socket.on('newPositions', function(data){
	ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas
	drawHexagonalGrid();  // Redraw grid

	 // Redraw the hovered hexagon, if any
	if (hoveredHex) {
	  highlightHexagon(hoveredHex);  // Highlight hovered hexagon
	}
	});

	// Mouse hover and click detection variables
	let hoveredHex = null;  // Track the hexagon being hovered over

	// Mouse event listeners
	canvas.addEventListener('mousemove', (event) => {
	const mouseX = event.offsetX;
	const mouseY = event.offsetY;

	hoveredHex = null;  // Reset hovered hexagon on each move

	// Check which hexagon the mouse is over
	hexagons.forEach(hex => {
	  if (isPointInHexagon(mouseX, mouseY, hex)) {
		hoveredHex = hex;
	  }
	});

	// Redraw the grid and highlight the hovered hexagon if necessary
	drawHexagonalGrid();
	if (hoveredHex) {
	  highlightHexagon(hoveredHex);  // Highlight hovered hexagon
	}
	});

	// If the mouse is still and over a hexagon, it will remain highlighted
	canvas.addEventListener('mouseout', () => {
	hoveredHex = null;  // Reset when the mouse leaves the canvas
	drawHexagonalGrid(); // Redraw grid without highlighting
	});

	// Highlight a hexagon
	function highlightHexagon(hex) {
	ctx.beginPath();
	ctx.moveTo(hex.x + radius, hex.y);  // Starting point
	for (let i = 1; i < 6; i++) {
	  let angle = Math.PI / 3 * i;
	  ctx.lineTo(hex.x + radius * Math.cos(angle), hex.y + radius * Math.sin(angle));
	}
	ctx.closePath();
	ctx.fillStyle = 'yellow';  // Highlighted color
	ctx.fill();
	ctx.stroke();
	}

	// Draw a single hexagon
	function drawHexagon(x, y, radius) {
	const angle = Math.PI / 3;  // 60 degrees
	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
	  let angleOffset = angle * i;
	  let xPos = x + radius * Math.cos(angleOffset);
	  let yPos = y + radius * Math.sin(angleOffset);
	  if (i === 0) ctx.moveTo(xPos, yPos);
	  else ctx.lineTo(xPos, yPos);
	}
	ctx.closePath();
	ctx.fillStyle = 'lightblue';  // Default color
	ctx.fill();
	ctx.stroke();
	}

	// Draw the entire hexagonal grid
	function drawHexagonalGrid() {
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

		// Draw the hexagon
		drawHexagon(x, y, radius);

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

	// Initial call to draw the grid
	drawHexagonalGrid();
	
});