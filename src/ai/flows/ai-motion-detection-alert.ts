
'use server';

/**
 * @fileOverview This file defines a Genkit flow for AI-powered motion detection alerts.
 *
 * It includes functions for:
 * - aiMotionDetectionAlert: Triggers alerts based on motion detection.
 * - AiMotionDetectionAlertInput: Interface for the input data (camera feed).
 * - AiMotionDetectionAlertOutput: Interface for the output data (alert message).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiMotionDetectionAlertInputSchema = z.object({
  cameraFeed: z
    .string()
    .describe(
      'A live video feed from the security camera as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type AiMotionDetectionAlertInput = z.infer<typeof AiMotionDetectionAlertInputSchema>;

const AiMotionDetectionAlertOutputSchema = z.object({
  alertMessage: z.string().describe('A message indicating the type of motion detected (human or vehicle) and the time of detection. If no significant motion is detected, says so.'),
});
export type AiMotionDetectionAlertOutput = z.infer<typeof AiMotionDetectionAlertOutputSchema>;

export async function aiMotionDetectionAlert(input: AiMotionDetectionAlertInput): Promise<AiMotionDetectionAlertOutput> {
  return aiMotionDetectionAlertFlow(input);
}

const aiMotionDetectionPrompt = ai.definePrompt({
  name: 'aiMotionDetectionPrompt',
  input: {schema: AiMotionDetectionAlertInputSchema},
  output: {schema: AiMotionDetectionAlertOutputSchema},
  prompt: `You are an AI-powered security system that analyzes camera feeds for motion detection.

  Analyze the provided camera feed and determine if any human or vehicle movement is detected.
  - If a human or vehicle is detected, generate an alert message stating what was detected.
  - If no human or vehicle is detected, return 'No significant motion detected.' for the alertMessage.

  Camera Feed: {{media url=cameraFeed}}
  `,
});

const aiMotionDetectionAlertFlow = ai.defineFlow(
  {
    name: 'aiMotionDetectionAlertFlow',
    inputSchema: AiMotionDetectionAlertInputSchema,
    outputSchema: AiMotionDetectionAlertOutputSchema,
  },
  async input => {
    const now = new Date();
    
    const {output} = await aiMotionDetectionPrompt(input);
    
    // Add timestamp to the AI's response if it generated an alert
    if (output && output.alertMessage !== 'No significant motion detected.') {
      const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return { alertMessage: `${output.alertMessage} at ${timestamp}.` };
    }
    
    return output!;
  }
);
