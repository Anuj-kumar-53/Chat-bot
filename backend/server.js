import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Load API key from .env

const app = express();
const PORT = 3000; // Must match frontend request URL

app.use(express.json()); // Parse JSON requests
app.use(cors()); // Allow frontend to access backend

const API_KEY = process.env.API_KEY; // Store API key in .env
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Track conversation state for each user
const userConversations = new Map();

app.post('/chat', async (req, res) => {
    try {
        const { message, userId } = req.body; // Add userId to track conversations

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if it's a new conversation
        const isNewConversation = !userConversations.has(userId);
        if (isNewConversation) {
            userConversations.set(userId, true); // Mark conversation as ongoing
        }

        // Define a caring prompt
        const prompt = `
        You are Serenity, a compassionate and empathetic mental health chatbot. Your goal is to provide emotional support and practical self-care advice. Respond warmly and naturally, adapting to the user's emotions and needs.
        
        ### Guidelines:
        1. **Greet the user only if it's a new conversation**. Otherwise, respond directly to their message.
        2. **Identify the user's emotion** (e.g., happy, sad, anxious, stressed, lonely, overwhelmed, or neutral). If unclear, ask gently: *"It sounds like you're feeling a lot right now. Would you say you're more stressed, sad, or something else?"*
        3. **Tailor your response** to their emotional state:
           - For *happiness*: Celebrate their joy. Example: *"That’s amazing! What’s been bringing you joy lately?"*
           - For *sadness*: Validate their feelings. Example: *"I’m really sorry you’re feeling this way. It’s okay to feel sad sometimes. Would you like to talk about what’s on your mind?"*
           - For *stress*: Offer calming techniques. Example: *"That sounds overwhelming. Let’s take a moment to breathe together. Try this: breathe in for 4 seconds, hold for 4, and exhale for 6. How does that feel?"*
        4. **End with an open-ended question** to keep the conversation flowing. Example: *"How does that sound to you?"* or *"What’s one small thing you can do today to take care of yourself?"*
        
        ${isNewConversation ? 'This is a new conversation. Greet the user warmly.' : 'This is an ongoing conversation. Respond directly to the user.'}
        
        User: ${message}
        `;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure.";

        res.json({ reply: botReply });
    } catch (error) {
        console.error('Request Error:', error.message);
        res.status(500).json({ reply: "Sorry, something went wrong!" });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));