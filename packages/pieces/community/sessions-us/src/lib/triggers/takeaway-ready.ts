import {
  createSessionsUsWebhookTrigger,
  SessionsUsWebhookTrigger,
} from '../common';

export const takeawayReady = createSessionsUsWebhookTrigger({
  name: 'takeaway_ready',
  displayName: 'Takeaway Ready',
  description: 'Triggered when a takeaway becomes available.',
  aiMetadata: {
    description: 'Fires when the AI-generated takeaways (summary notes) for a session have finished processing and are available. The payload includes the session id and the takeaways as both plain text and rich document content.',
  },
  trigger: SessionsUsWebhookTrigger.TAKEAWAY_READY,
  storeKey: 'sessions_takeaway_ready_trigger',
  sampleData: {
    session: {
      id: 'e5ebb4a1-a5a5-4a10-b18b-e1a89ddac27e',
      takeawaysText: 'Hello',
      takeawaysRaw: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: {
              textAlign: 'left',
              indent: 0,
            },
            content: [
              {
                type: 'text',
                text: 'Hello',
              },
            ],
          },
        ],
      },
    },
  },
});
