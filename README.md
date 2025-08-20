# AI Murder Mystery Web Game

A text-based murder mystery game powered by the Google Gemini API.

## Local Setup

1.  **Clone the repository:**
    ```bash
    git clone [your-repository-url]
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file:**
    In the root directory, create a file named `.env` and add your Gemini API key.
    ```
    API_KEY="YOUR_API_KEY_HERE"
    ```
4.  **Run the server:**
    ```bash
    npm start
    ```
    The server will start on port 3000.
5.  **Open the game:**
    Open your web browser and navigate to `http://localhost:3000`.

## Web Deployment

This project can be deployed to any service that supports Node.js, such as Render, Heroku, or DigitalOcean.

-   Set the `npm start` command.
-   Add your `API_KEY` as an environment variable in the host's settings.