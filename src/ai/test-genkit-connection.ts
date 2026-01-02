
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local manually before importing anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log("Loading Genkit...");
    // Dynamic import to ensure env vars are loaded first
    const { ai } = await import('./genkit');

    console.log("Testing Genkit connection...");
    try {
        const response = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: 'Hello, are you online?',
            config: { temperature: 1 },
        });

        console.log("Connection successful!");
        console.log("Response:", JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

main();
