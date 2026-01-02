
'use server';

/**
 * @fileOverview A conversational flow for the Eyronix support chatbot.
 *
 * - chatbotConversation - A function that generates a response based on conversation history.
 * - ChatbotConversationInput - The input type for the chatbotConversation function.
 * - ChatbotConversationOutput - The return type for the chatbotConversation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Message } from 'genkit/experimental/ai';
import { servicesTool, productsTool, pricingTool } from '../tools/data-tools';

const ChatbotConversationInputSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.array(z.object({ text: z.string() })),
      })
    )
    .describe('The conversation history.'),
  message: z.string().describe('The latest message from the user.'),
});
export type ChatbotConversationInput = z.infer<
  typeof ChatbotConversationInputSchema
>;

const ChatbotConversationOutputSchema = z.object({
  response: z.string().describe("The chatbot's response to the user."),
});
export type ChatbotConversationOutput = z.infer<
  typeof ChatbotConversationOutputSchema
>;

export async function chatbotConversation(
  input: ChatbotConversationInput
): Promise<ChatbotConversationOutput> {
  return chatbotConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatbotConversationPrompt',
  input: { schema: ChatbotConversationInputSchema },
  output: { schema: ChatbotConversationOutputSchema },
  // Provide the tools to the AI
  tools: [servicesTool, productsTool, pricingTool],
  system: `You are a friendly and helpful customer support assistant for Eyronix Syria, a modern security solutions provider. Your goal is to answer user questions about products (CCTV, Dashcams), services (installation, maintenance), and pricing.

  - Be concise and friendly.
  - When a user asks about services, products, or pricing, you MUST use the provided tools to get the most up-to-date information.
  - After getting data from a tool, present it to the user in a clear and easy-to-understand way. Do not just output the raw JSON data.
  - If you don't know the answer and the tools do not provide one, politely state that you are a bot and a human agent will be in touch.
  - Use the conversation history to understand the context of the user's question.`,
  // The prompt is now just the user's message. The history is passed separately.
  prompt: `{{{message}}}`,
});

const chatbotConversationFlow = ai.defineFlow(
  {
    name: 'chatbotConversationFlow',
    inputSchema: ChatbotConversationInputSchema,
    outputSchema: ChatbotConversationOutputSchema,
  },
  async input => {
    // The history is now passed to the prompt along with the new message.
    const { output } = await prompt({
      history: input.history as Message[],
      message: input.message,
    });
    return { response: output!.response };
  }
);
