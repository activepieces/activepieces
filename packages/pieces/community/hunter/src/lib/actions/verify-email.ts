import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from '../common/client';
import { hunterIoAuth } from '../common/auth';

export const verifyEmailAction = createAction({
  auth: hunterIoAuth,
  name: 'verify_email',
  displayName: 'Verify Email',
  description:
    'Check the deliverability and validation status of a single email address.',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address you want to verify.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { email } = propsValue;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please provide a valid email address.');
    }

    try {
      const response = await hunterIoApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/email-verifier',
        query: { email },
      });
      return response;
    } catch (error: any) {
      if (error.message.includes('202')) {
        throw new Error(
          'Verification is in progress. Please try the request again in a few moments.'
        );
      }
      if (error.message.includes('222')) {
        throw new Error(
          'Verification failed due to an issue with the remote server. Please try again later.'
        );
      }
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request. Please ensure you have provided a valid email address.'
        );
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      if (error.message.includes('451')) {
        throw new Error(
          'The owner of this email has requested their data not be processed.'
        );
      }
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to verify email: ${error.message}`);
    }
  },
});
