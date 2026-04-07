import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Helper to manage persistent state of the current API key index
const STATE_FILE = path.join(process.cwd(), '.api_state.json');

const getRotationState = () => {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('Error reading rotation state:', err.message);
    }
    return { currentKeyIndex: 0 };
};

const saveRotationState = (index) => {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify({ currentKeyIndex: index }));
    } catch (err) {
        console.error('Error saving rotation state:', err.message);
    }
};

const getAvailableKeys = () => {
    const keys = [];
    let i = 1;
    while (process.env[`GEMINI_API_KEY_${i}`]) {
        keys.push(process.env[`GEMINI_API_KEY_${i}`]);
        i++;
    }
    // Fallback to the single GEMINI_API_KEY if no numbered ones exist
    if (keys.length === 0 && process.env.GEMINI_API_KEY) {
        keys.push(process.env.GEMINI_API_KEY);
    }
    return keys;
};

// Initialize Gemini API
export const analyzeScrapImage = async (req, res) => {
    let availableMaterials = [];
    try {
        const apiKeys = getAvailableKeys();
        if (apiKeys.length === 0) {
            return res.status(500).json({ success: false, message: 'No Gemini API keys configured in .env' });
        }

        let { currentKeyIndex } = getRotationState();
        availableMaterials = req.body.availableMaterials;

        if (typeof availableMaterials === 'string') {
            try { availableMaterials = JSON.parse(availableMaterials); } catch (e) { availableMaterials = [availableMaterials]; }
        }

        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        const imageData = fs.readFileSync(imageFile.path);
        const imagePart = {
            inlineData: { data: imageData.toString('base64'), mimeType: imageFile.mimetype },
        };

        const prompt = `
            You are a scrap material expert for a recycling platform called RecycoTrack.
            
            TASKS:
            1. Scan the image and identify ALL materials from this list that are present: [${availableMaterials.join(', ')}].
            2. For each identified material, assess the quality grade: [Premium, A Grade, B Grade, Standard, Poor].
            3. Provide a brief one-sentence reason for this assessment.
            4. Provide a confidence percentage (0-100).

            IMPORTANT: 
            - If you find materials from the list, set "isMatch": true and use the material name from the list.
            - If you find objects that are NOT in the list, set "isMatch": false, identify what the object is in the "material" field (e.g. "Flowers", "Furniture", "Electronic Device"), and explain why it's not recyclable in the "reason" field.
            
            Output strictly as a JSON array of objects:
            [
                {
                    "isMatch": boolean,
                    "material": "string",
                    "quality": "string",
                    "reason": "string",
                    "confidence": number
                }
            ]
        `;

        // Strategy: Iterate through all keys starting from the last successful one
        let analysisText = null;
        let keysTried = 0;

        while (keysTried < apiKeys.length) {
            const keyIndex = (currentKeyIndex + keysTried) % apiKeys.length;
            const currentKey = apiKeys[keyIndex];
            
            console.log(`🚀 Using Gemini API Key #${keyIndex + 1} (Attempt ${keysTried + 1}/${apiKeys.length})`);

            try {
                const genAI = new GoogleGenerativeAI(currentKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

                // Internal retry for transient errors
                const result = await model.generateContent([prompt, imagePart]);
                const response = await result.response;
                analysisText = response.text();

                // If successful, update the starting key for the next request and break
                saveRotationState(keyIndex);
                break;
            } catch (err) {
                const isQuotaError = err.message.includes('429') || err.message.toLowerCase().includes('quota');
                
                if (isQuotaError) {
                    console.warn(`🛑 Key #${keyIndex + 1} reached quota limit. Trying next key...`);
                    keysTried++;
                    continue;
                }
                // If it's a different error, throw it immediately
                throw err;
            }
        }

        if (!analysisText) {
            // All keys failed with quota errors
            return res.status(429).json({ 
                success: false, 
                message: 'All available AI capacity has been reached for today.',
                errorCode: 'ALL_KEYS_EXHAUSTED'
            });
        }

        // Clean up and parse response
        const jsonMatch = analysisText.match(/\[[\s\S]*\]/);
        const analysisResults = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);

        return res.json({ success: true, analysis: analysisResults });

    } catch (error) {
        console.error('AI Analysis Error:', error.message);
        res.status(500).json({ success: false, message: 'AI Analysis Failed', error: error.message });
    } finally {
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (err) { console.error('Failed to delete temp file:', err.message); }
        }
    }
};

