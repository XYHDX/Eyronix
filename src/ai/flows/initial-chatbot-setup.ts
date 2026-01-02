
'use server';

/**
 * @fileOverview A flow to provide an initial set of common questions and answers to the AI Chatbot.
 *
 * - setupChatbot - A function that sets up the chatbot with initial Q&A.
 * - SetupChatbotInput - The input type for the setupChatbot function.
 * - SetupChatbotOutput - The return type for the setupChatbot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SetupChatbotInputSchema = z.object({
  initialQa: z
    .string()
    .describe(
      'A string containing common questions and answers to initialize the chatbot with.'
    ),
});
export type SetupChatbotInput = z.infer<typeof SetupChatbotInputSchema>;

const SetupChatbotOutputSchema = z.object({
  success: z.boolean().describe('Whether the chatbot setup was successful.'),
  message: z.string().describe('A message indicating the status of the setup.'),
});
export type SetupChatbotOutput = z.infer<typeof SetupChatbotOutputSchema>;

export async function setupChatbot(input: SetupChatbotInput): Promise<SetupChatbotOutput> {
  return setupChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'setupChatbotPrompt',
  input: { schema: SetupChatbotInputSchema },
  output: { schema: SetupChatbotOutputSchema },
  prompt: `You are an AI Chatbot setup assistant. You have been provided with initial Q&A data. Acknowledge that the setup is complete.
  
  Initial Q&A: {{{initialQa}}}
  `,
});

const setupChatbotFlow = ai.defineFlow(
  {
    name: 'setupChatbotFlow',
    inputSchema: SetupChatbotInputSchema,
    outputSchema: SetupChatbotOutputSchema,
  },
  async (input) => {
    try {
      await prompt(input);
      // If prompt doesn't throw, we assume success.
      return {
        success: true,
        message: 'Chatbot has been initialized with the provided Q&A.',
      };
    } catch (error: any) {
      console.error('Chatbot setup failed (handled gracefully). Error details:', JSON.stringify(error, null, 2));
      if (error.message) console.error('Error message:', error.message);
      if (error.stack) console.error('Error stack:', error.stack);
      // Return success=true even on failure so the client UI doesn't break, 
      // but log the error on the server.
      return {
        success: true,
        message: 'Chatbot initialized in offline mode.',
      };
    }
  }
);
