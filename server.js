// Import the necessary libraries
const express = require("express");
const path = require("path");
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

// Use the dotenv library to load environment variables from the .env file
require("dotenv").config();

// Check if the API key is available
if (!process.env.API_KEY) {
  console.error(
    "API_KEY not found in .env file. Please add your key to a file named .env"
  );
  process.exit(1);
}

// Define the static game elements
const suspects = ["Kabir", "Ananya", "Siddharth", "Diya", "Meera"];
const weapons = [
  "a broken beer bottle",
  "a heavy textbook",
  "a pool cue",
  "a shard of glass from a window",
  "a stolen kitchen knife",
];
const motives = [
  "revenge for a past betrayal",
  "financial gain from his will",
  "to protect a dark secret",
  "a moment of passion fueled by jealousy",
  "to cover up a crime",
];
const rooms = [
  "the kitchen",
  "the living room",
  "the basement",
  "the bedroom",
  "the balcony",
];

// Import the Google Generative AI library
const {
  GoogleGenerativeAI
} = require("@google/generative-ai");

// Set up the Generative AI model with the API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const sessions = new Map();

const basePrompt = (currentMystery) => {
  return `
You are a text-based murder mystery game master. Your role is to guide the player through a dynamic,
ever-changing mystery. A murder has occurred at a packed college house party.

The victim is a popular but arrogant student, Rohan Sharma.

The truth of this specific mystery is:
- The killer is: ${currentMystery.killer}
- The murder weapon is: ${currentMystery.weapon}
- The motive is: ${currentMystery.motive}

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
`;
};

const generateMystery = () => {
  return {
    killer: suspects[Math.floor(Math.random() * suspects.length)],
    weapon: weapons[Math.floor(Math.random() * weapons.length)],
    motive: motives[Math.floor(Math.random() * motives.length)],
  };
};

const resetGame = () => {
    const newMystery = generateMystery();
    console.log("New mystery generated:", newMystery);

    const mainChat = model.startChat({
        history: [{
            role: "user",
            parts: [{ text: basePrompt(newMystery) }]
        }],
        generationConfig: {
            maxOutputTokens: 500,
        },
    });

    const suspectChats = new Map();
    return { mystery: newMystery, mainChat, suspectChats };
};

app.use(cors());
app.use(express.static(path.join(__dirname, "")));
app.use(express.json());

app.post("/api/new-session", (req, res) => {
    const sessionId = Date.now().toString() + Math.random().toString().substring(2, 6);
    const newSessionData = resetGame();
    sessions.set(sessionId, newSessionData);
    res.json({ sessionId });
});

app.post("/api/start-game", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessions.has(sessionId)) {
        return res.status(404).json({ response: "Session not found." });
    }

    const { mainChat } = sessions.get(sessionId);

    try {
        const result = await mainChat.sendMessage(`
        As the game master, provide an opening narrative. 
        Introduce the player as a student who is also a skilled amateur detective. 
        Describe the scene of the crime and the initial chaos of the party. 
        Describe how the body was found. End by asking the player what they want to do next.
        `);

        const response = await result.response;
        const text = response.text();
        res.json({ response: text, location: "living_room" });
    } catch (error) {
        console.error("Error starting the game:", error);
        res.status(500).json({
            response: "An error occurred while starting the game.",
        });
    }
});

app.post("/api/game-turn", async (req, res) => {
    const { sessionId, input, location } = req.body;
    if (!sessions.has(sessionId)) {
        return res.status(404).json({ response: "Session not found." });
    }

    const session = sessions.get(sessionId);
    const { mainChat } = session;
    session.location = location;

    try {
        const result = await mainChat.sendMessage(input);
        const response = await result.response;
        const text = response.text();
        res.json({ response: text, location: session.location });
    } catch (error) {
        console.error("Error communicating with the AI:", error);
        res.status(500).json({
            response: "An error occurred while getting the AI's response. Please try again later.",
        });
    }
});

app.post("/api/interrogate", async (req, res) => {
    const { sessionId, suspectName, input } = req.body;
    if (!sessions.has(sessionId)) {
        return res.status(404).json({ response: "Session not found." });
    }

    const session = sessions.get(sessionId);
    const { suspectChats } = session;

    let suspectChat = suspectChats.get(suspectName);
    if (!suspectChat) {
        const personaPrompt = `You are now roleplaying as ${suspectName}, one of the suspects in the murder mystery. The player is interrogating you. You must act in character based on your description. The murder happened at a college house party. The victim is Rohan Sharma. The killer is ${session.mystery.killer}. You must keep this secret and act accordingly. Respond to the player's questions as ${suspectName} would.`;
        suspectChat = model.startChat({
            history: [{ role: "user", parts: [{ text: personaPrompt }] }],
            generationConfig: { maxOutputTokens: 500 },
        });
        suspectChats.set(suspectName, suspectChat);
    }
    
    try {
        const result = await suspectChat.sendMessage(input);
        const response = await result.response;
        const text = response.text();
        res.json({ response: text });
    } catch (error) {
        console.error("Error during interrogation:", error);
        res.status(500).json({ response: "An error occurred during interrogation." });
    }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});