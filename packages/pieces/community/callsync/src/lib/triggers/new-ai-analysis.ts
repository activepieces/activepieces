import { callsyncWebhookTrigger } from '../common/webhook-trigger';
import { aiAnalysisSample } from '../common/samples';

export const newAiAnalysis = callsyncWebhookTrigger({
  name: 'new_ai_analysis',
  displayName: 'Call AI Analysis Ready',
  description: 'Triggers when a call\'s transcript and AI summary are ready.',
  aiDescription:
    'Fires when CallSync finishes the AI analysis of a call: transcript, summary, mood, call reason, suggested next action and suggested tasks.',
  event: 'ai_analysis',
  sampleData: aiAnalysisSample,
});
