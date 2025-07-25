import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from '../common/client';
import { hunterIoAuth } from '../common/auth';

export const findEmailAction = createAction({
  auth: hunterIoAuth,
  name: 'find_email',
  displayName: 'Find an Email',
  description:
    'Find the most likely email address for a person using their name and a domain or company.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain name of the company (e.g., reddit.com).',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The name of the company (e.g., Reddit).',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "The person's first name.",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "The person's last name.",
      required: false,
    }),
    full_name: Property.ShortText({
      displayName: 'Full Name',
      description:
        "The person's full name. Use this if first/last name are not available.",
      required: false,
    }),
    max_duration: Property.Number({
      displayName: 'Max Duration (seconds)',
      description:
        'The maximum time to run the request. Default is 10, must be between 3 and 20.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { domain, company, first_name, last_name, full_name, max_duration } =
      propsValue;

    if (!domain && !company) {
      throw new Error('You must provide either a Domain or a Company name.');
    }

    if (!full_name && (!first_name || !last_name)) {
      throw new Error(
        'You must provide either a Full Name, or both a First Name and a Last Name.'
      );
    }

    if (max_duration && (max_duration < 3 || max_duration > 20)) {
      throw new Error(
        'Max Duration must be between 3 and 20 seconds.'
      );
    }

    const query: Record<string, string | number> = {};
    if (domain) query['domain'] = domain;
    if (company) query['company'] = company;
    if (first_name) query['first_name'] = first_name;
    if (last_name) query['last_name'] = last_name;
    if (full_name) query['full_name'] = full_name;
    if (max_duration) query['max_duration'] = max_duration;

    try {
      const response = await hunterIoApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/email-finder',
        query,
      });
      return response;
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new Error(
          'A conflict occurred. Please check the resource state.'
        );
      }
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request. Please ensure you have provided valid parameters as per the requirements.'
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

      throw new Error(`Failed to find email: ${error.message}`);
    }
  },
});
