import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MagicalapiAuth } from '../common/auth';

export const reviewResume = createAction({
  name: 'reviewResume',
  displayName: 'Review Resume',
  description: 'Analyze parsed resume using predefined criteria to receive feedback and suggestions',
  auth: MagicalapiAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Resume URL',
      description: 'URL to a publicly accessible resume file. Supported formats: PDF, DOC, DOCX. Maximum size: 10MB.',
      required: true,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: 'Use an existing request ID to fetch results of a previous request',
      required: false,
    }),
  },
  async run(context) {
    const { url, request_id } = context.propsValue;
    const auth = context.auth;

    // Prepare the request payload
    const payload: Record<string, string> = {};
    if (request_id) {
      payload['request_id'] = request_id;
    } else if (url) {
      payload['url'] = url;
    } else {
      throw new Error('Either URL or Request ID is required');
    }

    let response = await makeRequest(
      auth,
      HttpMethod.POST,
      '/resume-review',
      payload
    );

    if (response.request_id && !response.score) {
      let attempts = 0;
      const maxAttempts = 5;
      const pollingInterval = 1000;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));

        response = await makeRequest(
          auth,
          HttpMethod.POST,
          '/resume-review',
          { request_id: response.request_id }
        );

        if (response.score !== undefined) {
          break;
        }

        attempts++;
      }

      if (response.score === undefined) {
        throw new Error(
          'Resume review is taking longer than expected. Please try again with the request_id: ' +
            response.request_id
        );
      }
    }

    return response;
  },
});
