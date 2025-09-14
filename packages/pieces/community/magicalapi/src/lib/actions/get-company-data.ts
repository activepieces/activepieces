import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MagicalapiAuth } from '../common/auth';

export const getCompanyData = createAction({
  name: 'getCompanyData',
  displayName: 'Get Company Data',
  description: 'Extract detailed information about companies from LinkedIn profiles',
  auth: MagicalapiAuth,
  props: {
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: false,
    }),
    company_username: Property.ShortText({
      displayName: 'LinkedIn Company Username',
      description: 'LinkedIn company username (found in company URL after /company/). Example: For "https://www.linkedin.com/company/google/", enter "google"',
      required: false,
    }),
    company_website: Property.ShortText({
      displayName: 'Company Website',
      description: 'Official website URL of the company',
      required: false,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: 'Use an existing request ID to fetch results of a previous request',
      required: false,
    }),
  },
  async run(context) {
    const { company_name, company_username, company_website, request_id } = context.propsValue;
    const auth = context.auth;

    const payload: Record<string, string> = {};
    
    if (request_id) {
      payload['request_id'] = request_id;
    } else if (company_name || company_username || company_website) {
      if (company_name) payload['company_name'] = company_name;
      if (company_username) payload['company_username'] = company_username;
      if (company_website) payload['company_website'] = company_website;
    } else {
      throw new Error('Either Company Name, LinkedIn Company Username, Company Website, or Request ID is required');
    }

    let response = await makeRequest(
      auth,
      HttpMethod.POST,
      '/company-data',
      payload
    );

    
    if (response.request_id && !response.company_name) {
      let attempts = 0;
      const maxAttempts = 5;
      const pollingInterval = 1000;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));

        response = await makeRequest(
          auth,
          HttpMethod.POST,
          '/company-data',
          { request_id: response.request_id }
        );

        if (response.company_name) {
          break;
        }

        attempts++;
      }

      if (!response.company_name) {
        throw new Error(
          'Company data retrieval is taking longer than expected. Please try again with the request_id: ' +
            response.request_id
        );
      }
    }

    return response;
  },
});
