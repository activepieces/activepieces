import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';

export const sendMessageAction = createAction({
  auth: aircallAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send SMS or MMS from a configured number',
  props: {
    from: Property.ShortText({
      displayName: 'From Number',
      description: 'The phone number to send from',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To Number',
      description: 'The phone number to send to',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Message Content',
      description: 'The message content',
      required: true,
    }),
  },
  async run(context) {
    // Validate inputs
    if (!context.propsValue.from || context.propsValue.from.trim().length === 0) {
      throw new Error('From number is required');
    }

    if (!context.propsValue.to || context.propsValue.to.trim().length === 0) {
      throw new Error('To number is required');
    }

    if (!context.propsValue.content || context.propsValue.content.trim().length === 0) {
      throw new Error('Message content is required');
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(context.propsValue.from.replace(/\s/g, ''))) {
      throw new Error('Invalid from phone number format');
    }

    if (!phoneRegex.test(context.propsValue.to.replace(/\s/g, ''))) {
      throw new Error('Invalid to phone number format');
    }

    // Validate message length
    if (context.propsValue.content.length > 1600) {
      throw new Error('Message content cannot exceed 1600 characters');
    }

    const client = makeClient({
      apiToken: context.auth.apiToken,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    try {
      const response = await client.makeRequest({
        method: HttpMethod.POST,
        url: '/messages',
        body: {
          from: context.propsValue.from.trim(),
          to: context.propsValue.to.trim(),
          content: context.propsValue.content.trim(),
        },
      });

      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your phone numbers and message content.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your API permissions.');
      }
      throw new Error(`Failed to send message: ${error.message}`);
    }
  },
}); 