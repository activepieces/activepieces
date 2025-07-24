import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterIoApiCall } from '../common/client';
import { hunterIoAuth } from '../common/auth';

export const countEmailsAction = createAction({
  auth: hunterIoAuth,
  name: 'count_emails',
  displayName: 'Count Emails',
  description:
    'Returns the number of email addresses found for a domain or company.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain name to search for (e.g., stripe.com).',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company name to search for (e.g., Stripe).',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Email Type',
      description: 'Filter the count by email type.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Personal', value: 'personal' },
          { label: 'Generic', value: 'generic' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const { domain, company, type } = propsValue;

    if (!domain && !company) {
      throw new Error('You must provide either a Domain or a Company name.');
    }

    const query: Record<string, string> = {};
    if (domain) query['domain'] = domain;
    if (company) query['company'] = company;
    if (type) query['type'] = type;

    try {
      const response = await hunterIoApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/email-count',
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
          'Invalid request. Please ensure you have provided a valid Domain, Company, or Type.'
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

      throw new Error(`Failed to count emails: ${error.message}`);
    }
  },
});
