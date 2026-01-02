import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

export const ai = apiKey
  ? genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.5-flash',
  })
  : ({
    definePrompt: (config: any) => (input: any) => Promise.resolve({ output: { response: "I'm offline (Missing API Key)" } }),
    defineFlow: (config: any, fn: any) => fn,
  } as any);
