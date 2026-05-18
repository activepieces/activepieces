import {
  createSessionsUsWebhookTrigger,
  SessionsUsWebhookTrigger,
} from '../common';

export const takeawayReady = createSessionsUsWebhookTrigger({
  name: 'takeaway_ready',
  displayName: 'Takeaway Ready',
  description: 'Triggered when a takeaway becomes available.',
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
