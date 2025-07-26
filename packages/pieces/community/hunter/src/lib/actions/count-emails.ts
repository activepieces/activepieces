import {
  createAction,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterAuth } from '../common/auth';
import { hunterApiCall } from '../common/client';
import { validateCompanyName } from '../common/props';

export const countEmailsAction = createAction({
  name: 'count_emails',
  auth: hunterAuth,
  displayName: 'Count Emails',
  description: 'Get the number of email addresses we have for one domain or company. Rate limited to 15 requests per second.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain name for which you want to know how many email addresses we have (e.g., "stripe.com")',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company name for which you want to know how many email addresses we have (e.g., "stripe"). Must be at least 3 characters. Domain gives better results.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Email Type',
      description: 'Get the count of only personal or generic email addresses. Leave empty for all types.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Personal emails only', value: 'personal' },
          { label: 'Generic emails only', value: 'generic' },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { domain, company, type } = propsValue;

    if (!domain && !company) {
      throw new Error('You must provide at least the domain name or the company name (or both)');
    }

    if (company) {
      validateCompanyName(company);
    }

    const queryParams: Record<string, any> = {};

    if (domain) queryParams['domain'] = domain;
    if (company) queryParams['company'] = company;
    if (type) queryParams['type'] = type;

    try {
      const response = await hunterApiCall({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/email-count',
        queryParams,
      });

      return response;

    } catch (error: any) {
      if (error.message.includes('400')) {
        if (error.message.includes('wrong_params')) {
          throw new Error('Domain or company is missing in the parameters. You must provide at least one.');
        }
        if (error.message.includes('invalid_type')) {
          throw new Error('The supplied type is invalid. Use "personal" or "generic".');
        }
        throw new Error('Bad request: Please check your parameters.');
      }

      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Email Count API is limited to 15 requests per second.');
      }

      throw new Error(`Failed to count emails: ${error.message}`);
    }
  },
}); 