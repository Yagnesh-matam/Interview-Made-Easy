const express = require('express');
const router = express.Router();
const axios = require('axios');

// Official Production Streaming Gateway URL
const HEYGEN_STREAMING_URL = 'https://api.heygen.com/v1/streaming';

// 1. Fetch a secure interactive streaming access token
router.post('/token', async (req, res) => {
    try {
        const response = await axios.post(
            `${HEYGEN_STREAMING_URL}.create_token`,
            {},
            {
                headers: {
                    'X-Api-Key': process.env.HEYGEN_API_KEY, // Official streaming header authentication
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Extract the valid session token from HeyGen's formal response array
        res.json({ token: response.data.data.token });
    } catch (error) {
        console.error("HeyGen Streaming Auth Fault:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to allocate interactive video credentials." });
    }
});

// 2. Open a fresh WebRTC streaming session room
router.post('/session/new', async (req, res) => {
    const { token, avatarId } = req.body;
    try {
        const response = await axios.post(
            `${HEYGEN_STREAMING_URL}.new`,
            {
                avatar_id: avatarId || "josh_lite_3_20230714",
                quality: "medium"
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data.data);
    } catch (error) {
        console.error("Streaming Session Allocation Fault:", error.response?.data || error.message);
        res.status(500).json({ error: "Could not provision streaming session parameters." });
    }
});

// 3. Drive the avatar vocalizations
router.post('/session/speak', async (req, res) => {
    const { token, sessionId, text } = req.body;
    try {
        await axios.post(
            `${HEYGEN_STREAMING_URL}.task`,
            {
                session_id: sessionId,
                text: text
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Avatar Vocalization Fault:", error.response?.data || error.message);
        res.status(500).json({ error: "Avatar failed to voice command." });
    }
});

// 4. Terminate the active session cleanly
router.post('/session/close', async (req, res) => {
    const { token, sessionId } = req.body;
    try {
        await axios.post(
            `${HEYGEN_STREAMING_URL}.stop`,
            { session_id: sessionId },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Session Teardown Fault:", error.response?.data || error.message);
        res.status(500).json({ error: "Session teardown failed." });
    }
});

module.exports = router;