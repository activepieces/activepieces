import {
  createSessionsUsWebhookTrigger,
  SessionsUsWebhookTrigger,
} from '../common';

export const transcriptReady = createSessionsUsWebhookTrigger({
  name: 'transcript_ready',
  displayName: 'Transcript Ready',
  description: 'Triggered when a session has ended.',
  trigger: SessionsUsWebhookTrigger.TRANSCRIPT_READY,
  storeKey: 'sessions_transcript_ready_trigger',
  sampleData: {
    session: {
      id: '8208f783-fba9-4045-ae6e-dea64f5ab7ea',
      transcripts: [
        {
          content: [
            {
              text: 'Hello, my name is...',
              language: 'en',
            },
          ],
          participantId: 'd98f984f-982b-4a17-8a3d-093a4a774b49',
          sourceTimestamp: '2023-11-30T10:50:26.363Z',
          sourceLanguage: 'en',
        },
      ],
    },
  },
});
