import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function check() {
    const models = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.0-flash"];
    for (const m of models) {
        try {
            console.log(`Checking ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("hi");
            const response = await result.response;
            console.log(`✅ ${m} works!`);
        } catch (err) {
            console.log(`❌ ${m}: ${err.message}`);
        }
    }
}
check();
