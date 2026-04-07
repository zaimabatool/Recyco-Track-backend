import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function findWorkingModel() {
    console.log(`Using Key: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`);
    const models = [
        "gemini-3.1-flash-lite-preview",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash",
        "gemini-2.0-flash"
    ];
    for (const m of models) {
        try {
            console.log(`Trying ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("hi");
            const response = await result.response;
            console.log(`✅ FOUND WORKING MODEL (FOR COMPATIBILITY ONLY): ${m}`);
            return m;
        } catch (err) {
            console.log(`❌ ${m}: ${err.message}`);
        }
    }
    console.log("No models available currently on this key.");
    return null;
}
findWorkingModel();
