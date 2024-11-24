// Import the Player class
const { Player } = require('./player');

// Lobby class to manage players and game state
class Lobby {
    constructor(id) {
        this.id = id;
        this.players = []; // Array to store players (sockets)
        this.maxPlayers = 2; // Max players per lobby (change as necessary)
        this.gameStarted = false; // Track if the game has started
    }

    // Add a player to the lobby and emit a name request
    addPlayer(socket) {
        if (this.players.length < this.maxPlayers) {
            const newPlayer = new Player(socket);
			socket.player = newPlayer
            this.players.push(newPlayer);
            socket.emit('nameRequest', { message: 'Please enter your name.' });
        }
    }

    // Start the game for this lobby
    startGame() {
        this.gameStarted = true;

        // Assign turns (Player 1 starts)
        this.players[0].setTurn(true);  // Player 1's turn
        this.players[1].setTurn(false); // Player 2's turn
		
		//prepare data to send out
		let lobbyId = this.id;
		let player1Name = this.players[0].name;
		let player2Name = this.players[1].name;

        this.players.forEach((player) => {
			player.socket.emit('gameStarted', { lobbyId, player1Name, player2Name });
        });
    }
}

// Lobby manager to handle multiple lobbies
class LobbyManager {
    constructor() {
        this.lobbies = {}; // Store lobbies by ID
        this.lobbyCounter = 0; // To generate unique lobby IDs
    }

    // Create a new lobby
    createLobby() {
		this.lobbyCounter++; // Increment to ensure unique lobby IDs
        const lobby = new Lobby(this.lobbyCounter);
        this.lobbies[this.lobbyCounter] = lobby;
        return lobby;
    }

    // Figure out which lobby a player should be assigned to. Call lobby.addPlayer to actually add them to the lobby.
    assignPlayerToLobby(socket) {
        let lobby = null;
        for (let id in this.lobbies) {
            if (this.lobbies[id].players.length < this.lobbies[id].maxPlayers) {
                lobby = this.lobbies[id];
                break;
            }
        }
        
        if (!lobby) {
            lobby = this.createLobby();
        }

        lobby.addPlayer(socket);
        return lobby;
    }

    // This is the 'main' of LobbyManager / what is called from app.js. Handle player lobbying upon connection, and listen for name submission / ending of turns.
    handlePlayerConnection(socket, io) {
        // Find or create a lobby for the new player
        var lobby = this.assignPlayerToLobby(socket);

		// Handle setting player name
		socket.on('setName', (data) => {
			let playerName = data.name
			socket.player.name = playerName;
			
			// Assign player number (1 or 2)
			if (lobby.players[0].name === playerName) {
				socket.player.playerNumber = 1;  // First player
			} else if (lobby.players[1].name === playerName) {
				socket.player.playerNumber = 2;  // Second player
			} else {
				console.error('Name mismatch');
				return;
			}
			
			// Start the game when both players have names
			if (lobby.players.length === 2 && lobby.players.every(player => player.name)) {
				lobby.startGame()
			}

		});

		// Switch whose turn it is upon 'end turn' button press
        socket.on('endTurn', function() {
            const player = lobby.players.find(p => p.socket === socket);
            if (player) {
                // Toggle turns
                const nextPlayer = lobby.players.find(p => p !== player);
                player.setTurn(false);
                nextPlayer.setTurn(true);
            }
        });
    }

    // Handle player disconnection
    handlePlayerDisconnect(socket) {
        for (let id in this.lobbies) {
            let lobby = this.lobbies[id];
            const index = lobby.players.findIndex(p => p.socket === socket);
            if (index !== -1) {
                lobby.players.splice(index, 1); // Remove player from the lobby
                break;
            }
        }
    }
}

module.exports = new LobbyManager();