import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from '../common/client';
import { hunterIoAuth } from '../common/auth';
import { leadFormProperties } from '../common/props';

export const createLeadAction = createAction({
  auth: hunterIoAuth,
  name: 'create_lead',
  displayName: 'Create a Lead',
  description: 'Create and store a new lead record.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the lead (e.g., john@example.com).',
      required: true,
    }),
    ...leadFormProperties,
  },
  async run({ propsValue, auth }) {
    const { email, ...optionalParams } = propsValue;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please provide a valid email address.');
    }

    const body: Record<string, unknown> = { email };

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value !== undefined && value !== null && value !== '') {
        body[key] = value;
      }
    }

    try {
      const response = await hunterIoApiCall({
        method: HttpMethod.POST,
        auth,
        resourceUri: '/leads',
        body,
      });
      return response;
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new Error(
          'A lead with this email may already exist or there is a data conflict.'
        );
      }
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request. Please check the format of the provided data (e.g., email, IDs).'
        );
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to create lead: ${error.message}`);
    }
  },
});
