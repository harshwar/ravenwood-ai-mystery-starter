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

// Function to send the player's input to our backend and get a response
async function getGameResponse(playerInput) {
    try {
        // We're making a POST request to our server's /api/game-turn endpoint
        const response = await fetch('/api/game-turn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // We convert the player's input into a JSON string to send to the server
            body: JSON.stringify({ input: playerInput }),
        });

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON response from the server
        const data = await response.json();
        
        // Return the response text
        return data.response;

    } catch (error) {
        console.error("Error communicating with the server:", error);
        return "An error occurred. Please try again.";
    }
}

// Function to handle the "Send" button click and other actions
async function handleSend(messageFromButton = null) {
    // Get the text the player typed in, or use the message from the button
    const input = messageFromButton || playerInput.value.trim();

    // Do nothing if the input is empty
    if (!input) {
        return;
    }

    // Append the player's message to the story display
    storyDisplay.innerHTML += `<div class="player-message"><strong>You:</strong> ${input}</div>`;

    // Clear the input box if we used the keyboard input
    if (!messageFromButton) {
        playerInput.value = '';
    }

    // Get a response from our backend
    const response = await getGameResponse(input);

    // Append the "AI's" response to the story display
    storyDisplay.innerHTML += `<div class="ai-message"><strong>AI:</strong> ${response}</div>`;
    
    // Scroll to the bottom to show the newest message
    storyDisplay.scrollTop = storyDisplay.scrollHeight;
}

// NEW FUNCTION to start the game
async function startGame() {
    try {
        const response = await fetch('/api/start-game', {
            method: 'POST',
        });
        const data = await response.json();
        const initialStory = data.response;

        // Hide the start screen and show the game UI
        startScreen.style.display = 'none';
        gameUI.style.display = 'block';

        // Display the initial story from the AI
        storyDisplay.innerHTML = `<div class="ai-message"><strong>AI:</strong> ${initialStory}</div>`;
        storyDisplay.scrollTop = storyDisplay.scrollHeight;
        
    } catch (error) {
        console.error("Error starting the game:", error);
        alert("Failed to start the game. Please check the server.");
    }
}

// Add an event listener to the start button
startButton.addEventListener('click', startGame);

// Add event listeners for the other game buttons
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