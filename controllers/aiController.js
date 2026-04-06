import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Initialize Gemini API
export const analyzeScrapImage = async (req, res) => {
    try {
        // Initialize Gemini API (Inside handler to ensure it has latest process.env)
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: 'Gemini API key not configured in .env' });
        }
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        let availableMaterials = req.body.availableMaterials;
        
        // Parse if it's a JSON string from FormData
        if (typeof availableMaterials === 'string') {
            try {
                availableMaterials = JSON.parse(availableMaterials);
            } catch (e) {
                availableMaterials = [availableMaterials];
            }
        }
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: 'Gemini API key not configured' });
        }

        // Convert image to GoogleGenerativeAI.Part object
        const imageData = fs.readFileSync(imageFile.path);
        const imagePart = {
            inlineData: {
                data: imageData.toString('base64'),
                mimeType: imageFile.mimetype,
            },
        };

        // Use gemini-3.1-flash-lite-preview as it has active availability during high demand periods
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

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

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        // Clean up the text (Gemini sometimes adds markdown code blocks)
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const analysisResults = JSON.parse(jsonMatch ? jsonMatch[0] : text);

        return res.json({
            success: true,
            analysis: analysisResults
        });

    } catch (error) {
        console.error('AI Analysis Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'AI Analysis Failed',
            error: error.message
        });
    } finally {
        // ALWAYS delete the temporary file
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Failed to delete temp file:', err.message);
            }
        }
    }
};
