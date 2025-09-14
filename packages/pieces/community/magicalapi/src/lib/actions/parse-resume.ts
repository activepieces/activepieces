import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MagicalapiAuth } from '../common/auth';

export const parseResume = createAction({
  name: 'parseResume',
  displayName: 'Parse Resume',
  description:
    'Extract structured data (name, email, experience, skills, etc.) from a resume file',
  auth: MagicalapiAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Resume URL',
      description:
        'URL to a publicly accessible resume file. Supported formats: PDF, DOC, DOCX. Maximum size: 10MB.',
      required: true,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description:
        'Use an existing request ID to fetch results of a previous request',
      required: false,
    }),
  },
  async run(context) {
    const { url, request_id } = context.propsValue;
    const auth = context.auth;

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
      '/resume-parser',
      payload
    );

    if (response.data.request_id && !response.data.basic) {
      let attempts = 0;
      const maxAttempts = 15;
      const pollingInterval = 3000;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));

        response = await makeRequest(auth, HttpMethod.POST, '/resume-parser', {
          request_id: response.data.request_id,
        });

        if (response.data.basic) {
          break;
        }
       
        attempts++;
      }

      if (!response.data.basic) {
        throw new Error(
          'Resume parsing is taking longer than expected. Please try again with the request_id: ' +
          response.data.request_id
        );
      }
    }

    return response;
  },
});
