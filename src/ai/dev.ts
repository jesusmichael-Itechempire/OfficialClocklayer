
import { config } from 'dotenv';
config({ path: '.env.local' });

import '@/ai/flows/human-verification.ts';
import '@/ai/flows/zealy-verification.ts';
import '@/ai/flows/messaging.ts';
