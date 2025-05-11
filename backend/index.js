// backend/index.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
// We no longer directly call the AI model from here in this flow,
// so axios might not be needed unless you use it for other purposes or initial webhook call to N8N.
// const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json()); // To parse incoming JSON from frontend AND n8n webhook

// --- Storage for tracking requests (Simplified - In a real app, use a DB or more robust cache) ---
// This example doesn't fully implement the linkage back to the frontend,
// but shows where you would store info related to request IDs.
const pendingRequests = new Map();

// --- API Endpoint: POST /api/chat ---
// Receives user prompt from frontend.
// In a real scenario, you would generate a unique ID here,
// store the request context (like user session), and send
// the prompt + ID to your N8N webhook URL.
// For simplicity in this example, we just acknowledge receipt.
app.post('/api/chat', async (req, res) => {
    const userPrompt = req.body.prompt;

    if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid or empty prompt provided.' });
    }

    // --- Simulate sending to N8N webhook ---
    // In a real app, you would generate a unique requestId and send it to N8N:
    // const requestId = require('uuid').v4(); // Need to install uuid: npm install uuid
    // pendingRequests.set(requestId, { status: 'processing', timestamp: Date.now(), res: res }); // Store response object (NOT recommended for production)
    // Or store a way to identify the frontend client (e.g., WebSocket connection)
    // try {
    //     await axios.post(process.env.N8N_WEBHOOK_URL, { prompt: userPrompt, requestId: requestId });
    //     console.log(`[Backend] Sent prompt to N8N webhook for requestId: ${requestId}`);
    // } catch (error) {
    //     console.error("[Backend] Error sending to N8N webhook:", error);
    //     // Handle error: remove from pendingRequests, send error to frontend via stored context
    //     // return res.status(500).json({ error: 'Failed to send prompt to processing service.' });
    // }
    // --- End Simulate sending to N8N webhook ---


    console.log(`[Backend] Received prompt from frontend: "${userPrompt}". Acknowledging receipt.`);

    // --- Respond immediately to frontend ---
    // You cannot wait for the N8N response in this same request.
    // The frontend needs to handle receiving the AI response later.
    // We return a status indicating the request is being processed.
    // In a real async flow, you'd include the requestId here:
    // res.json({ status: "processing", requestId: requestId, message: "Processing started. Please wait for the response." });

     // For this example, we'll just send a simple acknowledgement.
     // The frontend will need a different mechanism to receive the actual AI response.
    res.json({ status: "received", message: "Prompt received by backend. Processing via webhook..." });

    // IMPORTANT: The AI response will NOT come back via this HTTP response.
    // It will come to the /api/n8n-callback endpoint later.
});


// --- API Endpoint: POST /api/n8n-callback ---
// This is the endpoint that N8N will call with the final AI response.
// Configure your N8N webhook node to send a POST request to THIS URL.
// N8N's webhook output should structure the data that is sent here.
app.post('/api/n8n-callback', (req, res) => {
    const n8nData = req.body; // The data sent by N8N webhook

    console.log("[Backend] Received callback from N8N:");
    console.log(JSON.stringify(n8nData, null, 2)); // Log the data received from n8n

    // --- Process the data received from N8N ---
    // N8N should ideally send the AI response AND the original requestId
    const aiResponse = n8nData.response; // Assume N8N sends the AI response in a field named 'response'
    const requestId = n8nData.requestId; // Assume N8N sends the original request ID back

    if (!aiResponse || !requestId) {
        console.error("[Backend] Received incomplete data from N8N callback (missing response or requestId).");
        return res.status(400).json({ status: 'error', message: 'Missing response or requestId in callback.' });
    }

    console.log(`[Backend] AI Response for requestId ${requestId}: "${aiResponse.substring(0, 100)}..."`);

    // --- Link back to the frontend client (TODO: Requires more implementation) ---
    // This is the complex part. You need a way to:
    // 1. Find the specific frontend client/browser instance that sent the original request with this requestId.
    // 2. Send the 'aiResponse' text to THAT specific frontend client.
    // Common methods:
    //    - WebSockets: Store the WebSocket connection object with the requestId in `pendingRequests`. When callback arrives, find the connection and send the message via WebSocket.
    //    - Long Polling: Frontend sends a "check status" request with requestId. Backend holds the request until N8N callback arrives, then responds.
    //    - Polling: Frontend periodically sends a "check status" request with requestId. Backend checks `pendingRequests` or a DB.

    // For this example, we just acknowledge receipt to N8N.
    // The actual delivery of aiResponse to the frontend IS NOT implemented here.
    res.json({ status: 'success', message: 'Callback received and processed (response logged). Frontend delivery needs implementation.' });

});


// --- Basic Root Endpoint (Optional) ---
app.get('/', (req, res) => {
    res.send('Cofe Code API is running and waiting for N8N callbacks on /api/n8n-callback!');
});


// --- Start the server ---
app.listen(port, () => {
    console.log(`Cofe Code API server running on port ${port}`);
    console.log(`Frontend connects to: POST http://localhost:${port}/api/chat`);
    console.log(`N8N webhook should send response to: POST http://localhost:${port}/api/n8n-callback`);
    console.log(`REMINDER: Frontend delivery of AI response from callback is NOT implemented in this example.`);
});