import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../../common';
export const ticketCreated = createTrigger({
  auth: aidbaseAuth,
  name: 'ticketCreated',
  displayName: 'Ticket Created',
  description: 'Fires when a new ticket is created in Aidbase.',
  props: {},
  sampleData: {
    id: 'evt_1Hc2X2JZ6qsJ5XQ',
    webhook_id: 'b44d118b-9648-41d9-abce-78ced777bb0e',
    object: 'webhook_event',
    created: '2023-10-31T17:36:56.491Z',
    type: 'ticket.created',
    changes: {},
    data: {
      id: 'a36306fa-0cc4-4497-8c2a-c7798cfdc720',
      ticket_form_id: 'I2o6Ii_4U6m48bmKTTMoR',
      hosted_ticket_form_url:
        'https://hosted.aidbase.ai/tickets/I2o6Ii_4U6m48bmKTTMoR',
      hosted_ticket_url:
        'https://hosted.aidbase.ai/ticket/I2o6Ii_4U6m48bmKTTMoR?ticket_id=a36306fa-0cc4-4497-8c2a-c7798cfdc720',
      status: 'OPEN',
      priority: 'MEDIUM',
      created: '2023-10-31T17:36:56.491Z',
      session_data: {
        id: 'f76c35921970',
        username: 'johndoe',
        email: 'john@doe.com',
        profile_image_url: 'https://cdn.example.com/profile.jpg',
        reference_id: '1234567890',
      },
      field_values: [
        {
          id: 'uv9xA',
          name: 'Your name',
          type: 'TEXT',
          value: 'John Doe',
        },
        {
          id: 'xa2-P',
          name: 'Your title',
          type: 'SELECT',
          value: [{ value: 'ceo', label: 'CEO' }],
        },
      ],
      comments: [
        {
          id: 'a3eb3199-c79e-40fd-b6f5-8fe3d5c70e58',
          type: 'USER',
          created: '2023-10-31T17:36:56.491Z',
          comment: 'Hello, I have a question about...',
          files: [
            'https://cdn.example.com/file1.jpg',
            'https://cdn.example.com/file2.jpg',
          ],
          session_data: {
            id: 'f76c35921970',
            username: 'johndoe',
            email: 'john@doe.com',
            profile_image_url: 'https://cdn.example.com/profile.jpg',
            reference_id: '1234567890',
          },
        },
      ],
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Not implemented because the Webhook is created in the Aidbase Dashboard
  },
  async onDisable(context) {
    // Not implemented because the Webhook is created in the Aidbase Dashboard
  },
  async run(context) {
    return [context.payload.body];
  },
});
