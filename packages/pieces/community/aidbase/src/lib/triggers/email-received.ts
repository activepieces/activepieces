import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../../common';

export const emailReceived = createTrigger({
  auth: aidbaseAuth,
  name: 'emailReceived',
  displayName: 'Email Received',
  description: 'Fires when a new email is received in Aidbase.',
  props: {},
  sampleData: {
    id: 'evt_1Hc2a8f36qsa23e',
    webhook_id: 'c1042e89-fea5-415c-8bd2-e557abf25307',
    object: 'webhook_event',
    created: '2023-10-31T17:36:56.491Z',
    type: 'email.received',
    changes: {
      message: {
        id: '9195f339-a6be-4d91-99ac-0c103fe0f089',
        type: 'USER',
        created: '2023-10-31T17:42:56.491Z',
        message: 'Thank you, I really appreciate your reply...',
        message_html: '<p>Thank you, I really appreciate your reply...</p>',
        files: [
          'https://cdn.aidbase.ai/286d123e-5961-457c-8fd5-56f192ec315d/some-file.jpg',
        ],
        errors: [],
        session_data: {
          username: 'John Doe',
          email: 'john@doe.com',
        },
      },
    },
    data: {
      id: '7c3c5609-b838-4643-8e8c-2a2da0a14c4a',
      email_inbox_id: '286d123e-5961-457c-8fd5-56f192ec315d',
      status: 'OPEN',
      priority: 'MEDIUM',
      topic: 'Question about something',
      created: '2023-10-31T17:36:56.491Z',
      session_data: {
        username: 'John Doe',
        email: 'john@doe.com',
      },
      messages: [
        {
          id: '4d2e74b1-b645-4beb-801c-9502c3ddaca8',
          type: 'USER',
          created: '2023-10-31T17:36:56.491Z',
          message: 'Hello, I have a question about...',
          message_html: '<p>Hello, I have a question about...</p>',
          files: [
            'https://cdn.aidbase.ai/286d123e-5961-457c-8fd5-56f192ec315d/some-file.jpg',
          ],
          errors: [],
          session_data: {
            username: 'John Doe',
            email: 'john@doe.com',
          },
        },
        {
          id: '00bcde85-2b4d-4682-ac8b-b280dc819559',
          type: 'AGENT',
          created: '2023-10-31T17:39:56.491Z',
          message: 'Hi John, than you for your message...',
          message_html: '<p>Hi John, than you for your message...</p>',
          files: [],
          errors: [],
          session_data: {
            id: '2b06ada3f5bb',
            username: 'jamesdoe',
            email: 'james@doe.com',
            profile_image_url: 'https://cdn.example.com/profile.jpg',
            reference_id: '1234567890',
          },
        },
        {
          id: '9195f339-a6be-4d91-99ac-0c103fe0f089',
          type: 'USER',
          created: '2023-10-31T17:42:56.491Z',
          message: 'Thank you, I really appreciate your reply...',
          message_html: '<p>Thank you, I really appreciate your reply...</p>',
          files: [
            'https://cdn.aidbase.ai/286d123e-5961-457c-8fd5-56f192ec315d/some-file.jpg',
          ],
          errors: [],
          session_data: {
            username: 'John Doe',
            email: 'john@doe.com',
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
