import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const dealUpdatedTrigger = createManualWebhookTrigger({
  name: 'deal_updated',
  displayName: 'Deal Updated',
  description: 'Triggers when a deal is updated in Outseta.',
  aiMetadata: {
    description:
      'Fires when a deal is updated in Outseta (e.g. amount or pipeline stage changes), delivering the updated deal with its linked account and people.',
  },
  sampleData: {
    Name: 'Updated Deal',
    Amount: 7500,
    DealPipelineStage: {
      Name: 'Negotiation',
      Uid: 'stage_example2',
    },
    Account: {
      Name: 'Acme Corp',
      Uid: 'acc_example1',
    },
    DealPeople: [
      {
        Person: {
          Email: 'jane.doe@example.com',
          FirstName: 'Jane',
          LastName: 'Doe',
          FullName: 'Jane Doe',
          Uid: 'per_example1',
        },
      },
    ],
    Uid: 'deal_example1',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-01-20T14:30:00',
  },
});
