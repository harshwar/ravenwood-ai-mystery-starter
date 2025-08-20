// Import the necessary libraries
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Use the dotenv library to load environment variables from the .env file
require('dotenv').config();

// Check if the API key is available
if (!process.env.API_KEY) {
    console.error("API_KEY not found in .env file. Please add your key to a file named .env");
    process.exit(1);
}

// Define the static game elements
const suspects = ["Kabir", "Ananya", "Siddharth", "Diya", "Meera"];
const weapons = ["a broken beer bottle", "a heavy textbook", "a pool cue", "a shard of glass from a window", "a stolen kitchen knife"];
const motives = [
    "revenge for a past betrayal",
    "financial gain from his will",
    "to protect a dark secret",
    "a moment of passion fueled by jealousy",
    "to cover up a crime"
];
const rooms = ["the kitchen", "the living room", "the basement", "the bedroom", "the balcony"];

function generateMystery() {
    const killer = suspects[Math.floor(Math.random() * suspects.length)];
    const weapon = weapons[Math.floor(Math.random() * weapons.length)];
    const motive = motives[Math.floor(Math.random() * motives.length)];
    
    return { killer, weapon, motive };
}

// Import the Google Generative AI library
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");

// Set up the Generative AI model with the API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Generate the mystery details at the start of the server
const mystery = generateMystery();
console.log("New mystery generated:", mystery);

// Base prompt to set up the game's core story and rules
const basePrompt = `
You are a text-based murder mystery game master. Your role is to guide the player through a dynamic,
ever-changing mystery. A murder has occurred at a packed college house party.

The victim is a popular but arrogant student, Rohan Sharma.

The truth of this specific mystery is:
- The killer is: ${mystery.killer}
- The murder weapon is: ${mystery.weapon}
- The motive is: ${mystery.motive}

The suspects are:
- The loyal but secretive best friend, **Kabir**.
- The competitive and estranged ex-girlfriend, **Ananya**.
- The mysterious artist from the rival college, **Siddharth**.
- The sharp-witted student reporter, **Diya**.
- The timid and nervous junior, **Meera**.

The possible murder weapons are: ${weapons.join(", ")}.
The rooms available for searching are: ${rooms.join(", ")}.

Instructions:
- Remember who the killer, weapon, and motive are for this scenario and keep them consistent. Do not reveal these details.
- Respond to the player's actions with a detailed narrative.
- End each response with a question to prompt the player for their next action.
- The player can choose to "interrogate" a suspect. When this happens, you should role-play as that suspect, answering questions as they would, while keeping their secrets.
- The player can also "search" a room. When they do, describe the room and any clues they might find. A clue must be related to the murder weapon or the killer, and should be placed in one of the rooms listed above.
`

// Initialize a chat session with the starting prompt. 
const chat = model.startChat({
    history: [
        {
            role: "user",
            parts: [{ text: basePrompt }]
        }
    ],
    generationConfig: {
        maxOutputTokens: 500,
    },
});

// Middleware to serve static files from the current directory
app.use(express.static(path.join(__dirname, '')));
app.use(express.json());

// Main route to handle game turns
app.post('/api/game-turn', async (req, res) => {
    try {
        const playerInput = req.body.input;
        console.log("Player input received:", playerInput);
        
        const result = await chat.sendMessage(playerInput);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });
    } catch (error) {
        console.error("Error communicating with the AI:", error);
        res.status(500).json({ response: "An error occurred while getting the AI's response. Please try again later." });
    }
});

// NEW ROUTE to start the game and get the initial AI message
app.post('/api/start-game', async (req, res) => {
    try {
        const result = await chat.sendMessage(`
        As the game master, provide an opening narrative. 
        Introduce the player as a student who is also a skilled amateur detective. 
        Describe the scene of the crime and the initial chaos of the party. 
        Describe how the body was found. End by asking the player what they want to do next.
        `);
        
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });
    } catch (error) {
        console.error("Error starting the game:", error);
        res.status(500).json({ response: "An error occurred while starting the game." });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Go to http://localhost:${port} to view the game.`);
});