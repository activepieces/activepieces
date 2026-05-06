import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const dealCreatedTrigger = createManualWebhookTrigger({
  name: 'deal_created',
  displayName: 'Deal Created',
  description: 'Triggers when a new deal is created in Outseta.',
  sampleData: {
    Name: 'New Deal',
    Amount: 5000,
    DealPipelineStage: {
      Name: 'Qualified',
      Uid: 'stage_example1',
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
    Updated: '2024-01-15T10:00:00',
  },
});
