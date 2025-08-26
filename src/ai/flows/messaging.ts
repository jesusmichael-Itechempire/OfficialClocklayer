
'use server';
/**
 * @fileOverview A flow for sending messages to all users.
 *
 * - sendMessageToAllUsers - Creates a new message document in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';

// This is client-side config, but it's safe to use in this server-side flow
// because Genkit executes it in a trusted environment.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// --- Schemas for Input and Output ---
const SendMessageInputSchema = z.object({
  title: z.string().describe('The title of the message.'),
  content: z.string().describe('The content of the message.'),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

const SendMessageOutputSchema = z.object({
  success: z.boolean().describe('Whether the message was sent successfully.'),
  message: z.string().describe('A confirmation or error message.'),
  messageId: z.string().optional().describe('The ID of the created message document.'),
});
export type SendMessageOutput = z.infer<typeof SendMessageOutputSchema>;

// --- Flow Definition ---
const sendMessageFlow = ai.defineFlow(
  {
    name: 'sendMessageFlow',
    inputSchema: SendMessageInputSchema,
    outputSchema: SendMessageOutputSchema,
  },
  async (input) => {
    try {
      const messagesCollection = collection(db, 'messages');
      const messageDoc = await addDoc(messagesCollection, {
        title: input.title,
        content: input.content,
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        message: 'Message sent successfully.',
        messageId: messageDoc.id,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        success: false,
        message: `Failed to send message: ${errorMessage}`,
      };
    }
  }
);

// --- Exported Wrapper Function ---
export async function sendMessageToAllUsers(input: SendMessageInput): Promise<SendMessageOutput> {
  return sendMessageFlow(input);
}
