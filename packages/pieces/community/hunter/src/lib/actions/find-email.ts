import {
  createAction,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterAuth } from '../common/auth';
import { hunterApiCall } from '../common/client';
import { validateMaxDuration } from '../common/props';

export const findEmailAction = createAction({
  name: 'find_email',
  auth: hunterAuth,
  displayName: 'Find an Email',
  description: 'This API endpoint finds the most likely email address from a domain name, a first name and a last name. Rate limited to 15 requests per second and 500 requests per minute.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain name of the company, used for emails. For example, "reddit.com".',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company name from which you want to find the email addresses. For example, "stripe". Note that providing the domain name gives better results as it removes the conversion from the company name. The company name doesn\'t need to be in lowercase.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The person\'s first name. It doesn\'t need to be in lowercase.',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name', 
      description: 'The person\'s last name. It doesn\'t need to be in lowercase.',
      required: false,
    }),
    full_name: Property.ShortText({
      displayName: 'Full Name',
      description: 'The person\'s full name. Note that you\'ll get better results by supplying the person\'s first and last name if you can. It doesn\'t need to be in lowercase.',
      required: false,
    }),
    max_duration: Property.Number({
      displayName: 'Max Duration',
      description: 'The maximum duration of the request in seconds. Setting a longer duration allows us to refine the results and provide more accurate data. It must range between 3 and 20. The default is 10.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { domain, company, first_name, last_name, full_name, max_duration } = propsValue;

    if (!domain && !company) {
      throw new Error('You must send at least the domain name or the company name. You can also send both.');
    }

    if (!full_name && (!first_name || !last_name)) {
      throw new Error('You must send at least the first name and the last name or the full name.');
    }

    if (max_duration !== undefined) {
      validateMaxDuration(max_duration);
    }

    const queryParams: Record<string, any> = {};

    if (domain) queryParams['domain'] = domain;
    if (company) queryParams['company'] = company;
    if (first_name) queryParams['first_name'] = first_name;
    if (last_name) queryParams['last_name'] = last_name;
    if (full_name) queryParams['full_name'] = full_name;
    if (max_duration !== undefined) queryParams['max_duration'] = max_duration;

    try {
      const response = await hunterApiCall({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/email-finder',
        queryParams,
      });

      return response;

    } catch (error: any) {
      if (error.message.includes('400')) {
        if (error.message.includes('wrong_params')) {
          throw new Error('A required parameter is missing.');
        }
        if (error.message.includes('invalid_first_name')) {
          throw new Error('The supplied first_name is invalid.');
        }
        if (error.message.includes('invalid_last_name')) {
          throw new Error('The supplied last_name is invalid.');
        }
        if (error.message.includes('invalid_full_name')) {
          throw new Error('The supplied full_name is invalid.');
        }
        if (error.message.includes('invalid_domain')) {
          throw new Error('The domain name is invalid, has no MX record or its owner has asked us to stop the processing of the associated data.');
        }
        if (error.message.includes('invalid_max_duration')) {
          throw new Error('The supplied max_duration is invalid.');
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
        throw new Error('Rate limit exceeded. Email Finder API is limited to 15 requests per second and 500 requests per minute.');
      }

      throw new Error(`Failed to find email: ${error.message}`);
    }
  },
}); 