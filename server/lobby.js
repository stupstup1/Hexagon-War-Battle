// lobby.js

// Lobby class to manage players and game state
class Lobby {
    constructor(id) {
        this.id = id;
        this.players = []; // Array to store players (sockets)
        this.maxPlayers = 2; // Max players per lobby (change as necessary)
        this.gameStarted = false; // Track if the game has started
    }

    // Add a player to the lobby
    addPlayer(socket) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(socket);
            socket.emit('gameStarted', { 
                message: 'Waiting for players...',
                lobbyId: this.id 
            });

            // If the lobby is full, start the game
            if (this.players.length === this.maxPlayers && !this.gameStarted) {
                this.startGame();
            }
        } else {
            socket.emit('gameStarted', { 
                message: 'Lobby is full, waiting for another lobby...',
                lobbyId: this.id 
            });
        }
    }

    // Start the game for this lobby
    startGame() {
        this.gameStarted = true;
        this.players.forEach((socket) => {
            socket.emit('gameStarted', { 
                message: 'The game is starting!',
                lobbyId: this.id 
            });
        });
    }
}

// Lobby manager to handle multiple lobbies
class LobbyManager {
    constructor() {
        this.lobbies = {}; // Store lobbies by ID
        this.lobbyCounter = 1; // To generate unique lobby IDs
    }

    // Create a new lobby
    createLobby() {
        const lobby = new Lobby(this.lobbyCounter);
        this.lobbies[this.lobbyCounter] = lobby;
        this.lobbyCounter++; // Increment to ensure unique lobby IDs
        return lobby;
    }

    // Assign a player to a lobby
    assignPlayerToLobby(socket) {
        // Find an available lobby or create a new one
        let lobby = null;
        for (let id in this.lobbies) {
            if (this.lobbies[id].players.length < this.lobbies[id].maxPlayers) {
                lobby = this.lobbies[id];
                break;
            }
        }
        
        if (!lobby) {
            // Create a new lobby if no available one is found
            lobby = this.createLobby();
        }

        // Add the player to the selected lobby
        lobby.addPlayer(socket);
        return lobby;
    }
}

// Export an instance of LobbyManager for use in app.js
module.exports = new LobbyManager();