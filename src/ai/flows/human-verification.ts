// This is an example Genkit flow definition.

'use server';

/**
 * @fileOverview Implements human verification using facial recognition.
 *
 * - verifyHuman - A function that verifies if a user is a real person.
 * - HumanVerificationInput - The input type for the verifyHuman function.
 * - HumanVerificationOutput - The return type for the verifyHuman function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HumanVerificationInputSchema = z.object({
  faceDataUri: z
    .string()
    .describe(
      "A photo of a user's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type HumanVerificationInput = z.infer<typeof HumanVerificationInputSchema>;

const HumanVerificationOutputSchema = z.object({
  isHuman: z.boolean().describe('Whether the provided face belongs to a real human.'),
  confidence: z
    .number()
    .describe('The confidence level of the human verification, from 0 to 1.'),
});
export type HumanVerificationOutput = z.infer<typeof HumanVerificationOutputSchema>;

export async function verifyHuman(input: HumanVerificationInput): Promise<HumanVerificationOutput> {
  return verifyHumanFlow(input);
}

const humanVerificationPrompt = ai.definePrompt({
  name: 'humanVerificationPrompt',
  input: {schema: HumanVerificationInputSchema},
  output: {schema: HumanVerificationOutputSchema},
  prompt: `You are an AI that verifies if a given face image belongs to a real human.

  Analyze the provided face image and determine if it is a real human face or not.

  Return a JSON object with the following fields:
  - isHuman: true if the face is a real human face, false otherwise.
  - confidence: A number between 0 and 1 indicating the confidence level of the verification.

  Face Image: {{media url=faceDataUri}}
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const verifyHumanFlow = ai.defineFlow(
  {
    name: 'verifyHumanFlow',
    inputSchema: HumanVerificationInputSchema,
    outputSchema: HumanVerificationOutputSchema,
  },
  async input => {
    const {output} = await humanVerificationPrompt(input);
    return output!;
  }
);
