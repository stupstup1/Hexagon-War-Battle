var PLAYERNUMBER;

$(document).ready(function() {
    socket = window.socket;  // Use the global socket object
    playerName = '';
	player1Name = '';
	player2Name = '';
    playerTurn = false;
	lobbyId = '';

    // Handle connection
    socket.on('connect', () => {
        console.log('Connected to server.');
    });

    // Listen for name request (player is prompted to enter name)
    socket.on('nameRequest', () => {
        document.getElementById('nameInputContainer').style.display = 'block';
    });

    // When the game starts, update UI with player names
    socket.on('gameStarted', function(data){
        lobbyId = data.lobbyId;
		player1Name = data.player1Name
		player2Name = data.player2Name
		
		PLAYERNUMBER = data.playerNumber;
		
		//Set elements with received data
        document.getElementById('lobby_id').textContent = lobbyId;
		document.getElementById('player1Name').textContent = player1Name;
		document.getElementById('player2Name').textContent = player2Name;
    });

    // Handle player's turn status
    socket.on('turnUpdate', data => {
        playerTurn = data.isTurn;
        if (playerTurn) {
            document.getElementById('endTurnBtn').style.display = 'block';
        } else {
            document.getElementById('endTurnBtn').style.display = 'none';
        }
    });
	
	// Handle end turn  when the player clicks end turn
    document.getElementById('endTurnBtn').addEventListener('click', endTurn);
	
    // Handle name submission when the player clicks submit
    document.getElementById('submitNameBtn').addEventListener('click', setPlayerName);

    // Set the player name and notify the server
    function setPlayerName() {
        playerName = document.getElementById('playerNameInput').value.trim();
        if (playerName) {
            socket.emit('setName', { name: playerName }); // Send the name to the server and await the response
            document.getElementById('nameInputContainer').style.display = 'none'; // Hide the input container
        } else {
            alert("Please enter a valid name.");
        }
    }

    // End turn action
    function endTurn() {
        socket.emit('endTurn');
    }
});
