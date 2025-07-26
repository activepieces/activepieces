import {
  createAction,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterAuth } from '../common/auth';
import { hunterApiCall } from '../common/client';
import { validateEmail } from '../common/props';

export const verifyEmailAction = createAction({
  name: 'verify_email',
  auth: hunterAuth,
  displayName: 'Verify an Email',
  description: 'This API endpoint allows you to verify the deliverability of an email address. The request will run for 20 seconds. If it was not able to provide a response in time, we will return a 202 status code. Rate limited to 10 requests per second and 300 requests per minute.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address you want to verify.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email } = propsValue;

    validateEmail(email);

    try {
      const response = await hunterApiCall({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/email-verifier',
        queryParams: {
          email: email,
        },
      });

      return response;

    } catch (error: any) {
      if (error.message.includes('202')) {
        throw new Error('The verification is still in progress. Feel free to make the API call again as often as necessary. It will only count as a single request until we return the response.');
      }

      if (error.message.includes('222')) {
        throw new Error('The verification failed because of an unexpected response from the remote SMTP server. This failure is outside of our control. We recommend to retry later.');
      }

      if (error.message.includes('400')) {
        if (error.message.includes('wrong_params')) {
          throw new Error('The email parameter is missing.');
        }
        if (error.message.includes('invalid_email')) {
          throw new Error('The supplied email is invalid.');
        }
        throw new Error('Bad request: Please check your input parameters.');
      }

      if (error.message.includes('451')) {
        if (error.message.includes('claimed_email')) {
          throw new Error('The person owning the email address asked us directly or indirectly to stop the processing of their personal data. For this reason, you shouldn\'t process it yourself in any way.');
        }
        throw new Error('Unavailable for legal reasons.');
      }

      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Email Verifier API is limited to 10 requests per second and 300 requests per minute.');
      }

      throw new Error(`Failed to verify email: ${error.message}`);
    }
  },
}); 