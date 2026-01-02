import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

export const ai = apiKey
  ? genkit({
    plugins: [googleAI({ apiKey })],
    model: 'googleai/gemini-2.0-flash',
  })
  : ({
    definePrompt: (config: any) => (input: any) => Promise.resolve({ output: { response: "I'm offline (Missing API Key)" } }),
    defineFlow: (config: any, fn: any) => fn,
    defineTool: (config: any, fn: any) => fn,
    generate: (config: any) => Promise.resolve({ text: () => "I'm offline (Missing API Key)" }),
  } as any);

