import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MagicalapiAuth } from '../common/auth';

export const scoreResume = createAction({
  name: 'scoreResume',
  displayName: 'Score Resume',
  description: 'Analyze a resume and provide a numerical score based on job description match',
  auth: MagicalapiAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Resume URL',
      description: 'URL to a publicly accessible resume file. Supported formats: PDF, DOC, DOCX. Maximum size: 10MB.',
      required: true,
    }),
    job_description: Property.LongText({
      displayName: 'Job Description',
      description: 'The job description to score the resume against. Provide a detailed description for better accuracy.',
      required: true,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: 'Use an existing request ID to fetch results of a previous request',
      required: false,
    }),
  },
  async run(context) {
    const { url, job_description, request_id } = context.propsValue;
    const auth = context.auth;

    const payload: Record<string, string> = {};
    
    if (request_id) {
      payload['request_id'] = request_id;
    } else if (url && job_description) {
      payload['url'] = url;
      payload['job_description'] = job_description;
    } else {
      throw new Error('Either Resume URL and Job Description, or Request ID is required');
    }

    // Make API request
    let response = await makeRequest(
      auth,
      HttpMethod.POST,
      '/resume-score',
      payload
    );

    if (response.data.request_id && response.data.score === undefined) {
      let attempts = 0;
      const maxAttempts = 15;
      const pollingInterval = 3000;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));

        response = await makeRequest(
          auth,
          HttpMethod.POST,
          '/resume-score',
          { request_id: response.data.request_id }
        );

        if (response.data.score !== undefined) {
          break;
        }

        attempts++;
      }

      if (response.data.score === undefined) {
        throw new Error(
          'Resume scoring is taking longer than expected. Please try again with the request_id: ' +
            response.data.request_id
        );
      }
    }

    return response;
  },
});
