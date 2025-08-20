// Get the HTML elements we need to work with
const sendButton = document.getElementById('send-button');
const playerInput = document.getElementById('player-input');
const storyDisplay = document.getElementById('story-display');
const suspectButtons = document.querySelectorAll('.suspect-button');
const roomButtons = document.querySelectorAll('.room-button');
const accuseButton = document.getElementById('accuse-button');
const startButton = document.getElementById('start-button');
const startScreen = document.getElementById('start-screen');
const gameUI = document.getElementById('game-ui');
const newGameButton = document.getElementById('new-game-button');

// Function to send the player's input to our backend and get a response
async function getGameResponse(playerInput) {
    try {
        const response = await fetch('/api/game-turn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: playerInput }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response;

    } catch (error) {
        console.error("Error communicating with the server:", error);
        return "An error occurred. Please try again.";
    }
}

// Function to handle the "Send" button click and other actions
async function handleSend(messageFromButton = null) {
    const input = messageFromButton || playerInput.value.trim();

    if (!input) {
        return;
    }

    storyDisplay.innerHTML += `<div class="player-message"><strong>You:</strong> ${input}</div>`;

    if (!messageFromButton) {
        playerInput.value = '';
    }

    const response = await getGameResponse(input);

    storyDisplay.innerHTML += `<div class="ai-message"><strong>AI:</strong> ${response}</div>`;
    
    storyDisplay.scrollTop = storyDisplay.scrollHeight;
}

// Function to start the game
async function startGame() {
    try {
        const response = await fetch('/api/start-game', {
            method: 'POST',
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const initialStory = data.response;

        startScreen.style.display = 'none';
        gameUI.style.display = 'block';

        storyDisplay.innerHTML = `<div class="ai-message"><strong>AI:</strong> ${initialStory}</div>`;
        storyDisplay.scrollTop = storyDisplay.scrollHeight;
        
    } catch (error) {
        console.error("Error starting the game:", error);
        alert("Failed to start the game. Please check the server.");
    }
}

// NEW FUNCTION to reset the game
async function newGame() {
    try {
        const response = await fetch('/api/new-game', {
            method: 'POST',
        });
        const data = await response.json();
        
        // Reset the frontend UI
        storyDisplay.innerHTML = '';
        gameUI.style.display = 'none';
        startScreen.style.display = 'block';

        alert(data.message);
    } catch (error) {
        console.error("Error resetting the game:", error);
        alert("Failed to start a new game. Please try again.");
    }
}

// Add event listeners
startButton.addEventListener('click', startGame);
newGameButton.addEventListener('click', newGame);
sendButton.addEventListener('click', () => handleSend());

playerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSend();
    }
});

suspectButtons.forEach(button => {
    button.addEventListener('click', () => {
        const suspectName = button.getAttribute('data-suspect');
        handleSend(`I want to interrogate ${suspectName}. What do they say when I approach them?`);
    });
});

roomButtons.forEach(button => {
    button.addEventListener('click', () => {
        const roomName = button.getAttribute('data-room');
        handleSend(`I want to search the ${roomName}. What do I find?`);
    });
});

accuseButton.addEventListener('click', () => {
    const accused = prompt("Who do you want to accuse of the murder?");
    if (accused) {
        handleSend(`I accuse ${accused}.`);
    } else {
        alert("Please enter a name to accuse.");
    }
});