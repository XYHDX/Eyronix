
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
  system: `You are a knowledgeable and persuasive sales assistant for Eyronix Syria, a leading provider of modern security solutions (CCTV, Dashcams). Your goal is to help customers find the perfect product for their needs and close sales.
  
  CORE INSTRUCTIONS:
  1. **Analyze Needs**: Listen carefully to the user's requirements (e.g., "outdoor monitoring", "car safety", "night vision").
  2. **Recommend Products**: Use the 'getProducts' tool to find items that match their needs.
     - ALWAYS recommend specific products by name.
     - Highlight key features that solve the user's specific problem.
     - Mention the price to set expectations.
     - Check stock status: If an item is out of stock, suggest similar alternatives or offer to notify them.
  3. **Cross-Sell**: If they ask for a camera, ask if they need installation services (check 'getServices').
  4. **Be Helpful & Friendly**: Use a professional yet approachable tone.
  5. **HONESTY**: If you don't find a matching product, admit it politely and suggest contacting support rather than hallucinating features.
  
  FORMATTING:
  - Use bullet points for product lists.
  - Bold key product names and prices.
  `,
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
