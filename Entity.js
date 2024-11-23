playerSpeed = 5

class Entity {
    constructor() {
        this.x = 250;
        this.y = 250;
        this.spdX = 0;
        this.spdY = 0;
        this.id = "";
    }

    update() {
        this.updatePosition();
    }

    updatePosition() {
        this.x += this.spdX;
        this.y += this.spdY;
    }
	
}

class Player extends Entity {
    constructor(id) {
        super();
        this.id = id;
        this.number = "" + Math.floor(100 * Math.random());
        this.pressingRight = false;
        this.pressingLeft = false;
        this.pressingUp = false;
        this.pressingDown = false;
        Player.list[id] = this; // Store Player instance in Player.list
    }

	// Update movement based on keypresses
    updateMovement() {
        if (this.pressingRight) {
            this.spdX = playerSpeed;  // Move to the right
        } else if (this.pressingLeft) {
            this.spdX = -playerSpeed; // Move to the left
        } else {
            this.spdX = 0;  // Stop horizontal movement
        }

        if (this.pressingDown) {
            this.spdY = playerSpeed;  // Move down
        } else if (this.pressingUp) {
            this.spdY = -playerSpeed; // Move up
        } else {
            this.spdY = 0;  // Stop vertical movement
        }
    }

    // Method to handle updates for all players
    static update() {
        var pack = [];
        for (var i in Player.list) {
            var player = Player.list[i];
            player.updateMovement(); // Call updateMovement() on each Player instance to update movement
			player.update(); //and call Entity's update() to update position
            pack.push({
                x: player.x,
                y: player.y,
                number: player.number
            });
        }
        return pack;
    }

    // Method to handle key press input (connected user)
    static onConnect(socket) {
        var player = new Player(socket.id);  // Create a new player instance for the socket ID
        socket.on('keyPress', function(data) {
            if (data.inputId === 'left')
                player.pressingLeft = data.state;
            else if (data.inputId === 'right')
                player.pressingRight = data.state;
            else if (data.inputId === 'up')
                player.pressingUp = data.state;
            else if (data.inputId === 'down')
                player.pressingDown = data.state;
        });
    }

    // Handle disconnecting users
    static onDisconnect(socket) {
        delete Player.list[socket.id];
    }
}

// Initialize a list to store Player instances
Player.list = {};

module.exports = { Entity, Player };
