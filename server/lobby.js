// Import the Player class
const { Player } = require('./Player');
const { Entity, Unit, Building, Leader, Farm, Barracks, Swordfighter, Archer, Cavalier, Catapult } = require('./entity');

// Lobby class to manage players and game state
class Lobby {
    constructor(id) {
        this.id = id;
        this.players = []; // Array to store players (sockets)
        this.maxPlayers = 2; // Max players per lobby (change as necessary)
        this.gameStarted = false; // Track if the game has started
		this.updateInterval = 1000 / 60;  // 1000 ms / 60 FPS = ~16.67 ms per frame
    }

    // Add a player to the lobby and emit a name request
    addPlayer(socket) {
        if (this.players.length < this.maxPlayers) {
            const newPlayer = new Player(socket);
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
		
		// prepare data to send out
		let lobbyId = this.id;
		let player1Name = this.players[0].name;
		let player2Name = this.players[1].name;
		
		// spawn leader farm and barracks for each player
        this.players[0].clearUnits();
        this.players[1].clearUnits();
        this.players[0].spawnUnit("Leader", 0, 3)
        this.players[0].spawnUnit("Barracks", 0, 4)
        this.players[0].spawnUnit("Farm", 0, 2)
        this.players[1].spawnUnit("Leader", 14, 3)
        this.players[1].spawnUnit("Barracks", 14, 4)
        this.players[1].spawnUnit("Farm", 14, 2)
		
		// start the game
        this.players.forEach((player) => {
			
			player.socket.emit('gameStarted', { lobbyId, player1Name, player2Name, playerNumber: this.getPlayerNumber(player) });
			
        });

        this.sendBoardUpdate();
    }
	
	getPlayerNumber(player)
	{
		let playerNum;
		
		this.players.forEach((curPlayer, i) => {
			if (curPlayer.socket === player.socket)
			{
				playerNum = `player${i + 1}`
			}
		});
		
		return playerNum;
	}

    sendBoardUpdate() {
        if (this.players.length !== 2) { return; }

        let player_current_actions = 0; //making sure these at least have a value
        let player_base_actions = 0;
        let current_player_turn = 1;
        this.players.forEach((player) => { //figure out whose turn it is, send the total action count of that player
            if (player.turn) { 
                current_player_turn = player.name;
                player_current_actions = player.current_actions;
                player_base_actions = player.base_actions;
            }
        })

        this.players.forEach((player) => {
            player.socket.emit('serverUpdate', { 
                player1_entities: this.players[0].entities_array, 
                player2_entities: this.players[1].entities_array,
                player_current_actions: player_current_actions,
                player_base_actions: player_base_actions,
                current_player_turn: current_player_turn
            }); 
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
			
			// Assign player number (1 or 2)
            if (!lobby.players[0].name) {
                lobby.players[0].name = playerName
                lobby.players[0].playerNumber = 1;
            } else {
                lobby.players[1].name = playerName
                lobby.players[1].playerNumber = 2;
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
            lobby.sendBoardUpdate(); //makes sure new player's current actions remaining are accurate
        });

        // Perform Action
        socket.on('performAction', function(data) {
            const { actionType, fromHex, toHex } = data;
            for (var i in lobby.players) {
                const player = lobby.players[i];
				const unitIndex = player.getUnitIfIsMine(fromHex);
				if (unitIndex == -1 || player.socket !== socket) { continue; } // prevent performing actions with units that aren't yours
				if (!player.turn) {continue; } // prevent performing actions if its not your turn
				if (player.doAction(unitIndex, data)){
				    let performed = true;
                    if (performed) {
                        lobby.sendBoardUpdate();
                    }
                }
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