
'use server';
/**
 * @fileOverview A Zealy task verification AI agent.
 *
 * - confirmZealyTasks - A secure flow to update a user's status after client-side verification.
 * - ConfirmZealyTasksInput - The input type for the confirmZealyTasks function.
 * - ConfirmZealyTasksOutput - The return type for the confirmZealyTasks function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
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
const ConfirmZealyTasksInputSchema = z.object({
  uid: z.string().describe("The user's Firebase UID."),
  zealyId: z.string().describe("The user's Zealy ID."),
  xp: z.number().describe("The user's XP from Zealy."),
});
export type ConfirmZealyTasksInput = z.infer<typeof ConfirmZealyTasksInputSchema>;

const ConfirmZealyTasksOutputSchema = z.object({
  success: z.boolean().describe('Whether the user status was successfully updated.'),
  message: z.string().describe('A confirmation or denial message for the user.'),
});
export type ConfirmZealyTasksOutput = z.infer<typeof ConfirmZealyTasksOutputSchema>;


// --- Flow Definition ---
const confirmZealyTasksFlow = ai.defineFlow(
  {
    name: 'confirmZealyTasksFlow',
    inputSchema: ConfirmZealyTasksInputSchema,
    outputSchema: ConfirmZealyTasksOutputSchema,
  },
  async (input) => {
    try {
      const userDocRef = doc(db, 'users', input.uid);
      
      await updateDoc(userDocRef, {
        hasCompletedZealyTasks: true,
        zealyId: input.zealyId,
        zealyXP: input.xp,
        waitlistJoinedAt: new Date(),
      });

      return {
        success: true,
        message: 'User waitlist status confirmed successfully.'
      };

    } catch (error) {
      console.error("An unexpected error occurred during user update:", error);
      return { 
        success: false, 
        message: "An unexpected error occurred while updating your status." 
      };
    }
  }
);

// --- Exported Wrapper Function ---
export async function confirmZealyTasks(input: ConfirmZealyTasksInput): Promise<ConfirmZealyTasksOutput> {
  return confirmZealyTasksFlow(input);
}
