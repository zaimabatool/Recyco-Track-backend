import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function check() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.models) {
             console.log(`✅ Key is valid, found ${data.models.length} models.`);
        } else {
             console.log(`❌ Error or invalid response: ${JSON.stringify(data)}`);
        }
    } catch (err) {
        console.log(`❌ Network Error: ${err.message}`);
    }
}
check();
