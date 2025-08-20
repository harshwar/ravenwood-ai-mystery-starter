// Get all HTML elements
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
const gameBackground = document.getElementById('game-background');
const interrogationBox = document.getElementById('interrogation-box');
const interrogationSuspectName = document.getElementById('interrogation-suspect-name');
const interrogationDisplay = document.getElementById('interrogation-display');
const interrogationInput = document.getElementById('interrogation-input');
const interrogationSendButton = document.getElementById('interrogation-send-button');
const closeInterrogationButton = document.getElementById('close-interrogation');

let sessionId = localStorage.getItem('sessionId');
let currentLocation = 'living_room';
let currentSuspect = '';

// Use a Map to store conversations for each suspect on the frontend
const interrogationHistories = new Map();

// Define the backgrounds
const backgrounds = {
    'living_room': 'url(assets/images/living_room.webp)',
    'kitchen': 'url(assets/images/kitchen.webp)',
    'basement': 'url(assets/images/basement.webp)',
    'bedroom': 'url(assets/images/bedroom.webp)',
    'balcony': 'url(assets/images/balcony.webp)'
};

function updateBackground(location) {
    console.log('Attempting to update background to:', location);
    gameBackground.style.backgroundImage = backgrounds[location] || backgrounds['living_room'];
}

async function getGameResponse(endpoint, body) {
    if (!sessionId) {
        alert("Please start a new game first.");
        return { response: "Session not found." };
    }
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId, ...body }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error communicating with the server:", error);
        return { response: "An error occurred. Please try again." };
    }
}

async function handleMainConversation(input) {
    if (!input) return;
    storyDisplay.innerHTML += `<div class="player-message"><strong>You:</strong> ${input}</div>`;

    const data = await getGameResponse('/api/game-turn', { input, location: currentLocation });
    if (data.response) {
        updateBackground(data.location);
        storyDisplay.innerHTML += `<div class="ai-message"><strong>AI:</strong> ${data.response}</div>`;
        storyDisplay.scrollTop = storyDisplay.scrollHeight;
    }
}

async function handleInterrogation(input) {
    if (!input) return;

    // Append the user's message to the display
    interrogationDisplay.innerHTML += `<div class="player-message"><strong>You:</strong> ${input}</div>`;

    // Store the conversation locally
    let history = interrogationHistories.get(currentSuspect) || '';
    history += `<div class="player-message"><strong>You:</strong> ${input}</div>`;

    const data = await getGameResponse('/api/interrogate', { suspectName: currentSuspect, input });
    if (data.response) {
        // Append the AI's response to the display and local history
        interrogationDisplay.innerHTML += `<div class="ai-message"><strong>${currentSuspect}:</strong> ${data.response}</div>`;
        history += `<div class="ai-message"><strong>${currentSuspect}:</strong> ${data.response}</div>`;
        interrogationDisplay.scrollTop = interrogationDisplay.scrollHeight;
    }

    // Save the updated history
    interrogationHistories.set(currentSuspect, history);
}

async function startGame() {
    if (!sessionId) {
        await startNewSession();
        return;
    }
    const data = await getGameResponse('/api/start-game', { location: currentLocation });
    if (data.response) {
        updateBackground(data.location);
        startScreen.style.display = 'none';
        gameUI.style.display = 'block';
        storyDisplay.innerHTML = `<div class="ai-message"><strong>AI:</strong> ${data.response}</div>`;
        storyDisplay.scrollTop = storyDisplay.scrollHeight;
    }
}

async function startNewSession() {
    const data = await getGameResponse('/api/new-session', {});
    if (data.sessionId) {
        sessionId = data.sessionId;
        localStorage.setItem('sessionId', sessionId);
        interrogationHistories.clear(); // Clear local storage on new game
        alert("New game session created!");
        startGame();
    }
}

// Interrogation logic
function startInterrogation(suspectName) {
    currentSuspect = suspectName;
    interrogationBox.style.display = 'block';
    storyDisplay.style.display = 'none';
    interrogationSuspectName.textContent = `Interrogating ${suspectName}`;
    
    // Load existing history or a new intro
    const history = interrogationHistories.get(suspectName);
    if (history) {
        interrogationDisplay.innerHTML = history;
        interrogationDisplay.scrollTop = interrogationDisplay.scrollHeight;
    } else {
        interrogationDisplay.innerHTML = `<div class="ai-message"><strong>AI:</strong> You approach ${suspectName}. What is your first question?</div>`;
    }
}

function closeInterrogation() {
    currentSuspect = '';
    interrogationBox.style.display = 'none';
    storyDisplay.style.display = 'block';
}

// Add event listeners
startButton.addEventListener('click', startNewSession);
newGameButton.addEventListener('click', startNewSession);
sendButton.addEventListener('click', () => {
    handleMainConversation(playerInput.value.trim());
    playerInput.value = '';
});

playerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleMainConversation(playerInput.value.trim());
        playerInput.value = '';
    }
});

suspectButtons.forEach(button => {
    button.addEventListener('click', () => {
        const suspectName = button.getAttribute('data-suspect');
        startInterrogation(suspectName);
    });
});

roomButtons.forEach(button => {
    button.addEventListener('click', () => {
        const roomName = button.getAttribute('data-room');
        currentLocation = roomName;
        handleMainConversation(`I want to search the ${roomName}. What do I find?`);
    });
});

closeInterrogationButton.addEventListener('click', closeInterrogation);
interrogationSendButton.addEventListener('click', () => {
    handleInterrogation(interrogationInput.value.trim());
    interrogationInput.value = '';
});
interrogationInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleInterrogation(interrogationInput.value.trim());
        interrogationInput.value = '';
    }
});