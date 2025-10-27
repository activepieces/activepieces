import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCompany = createAction({
  auth: folkAuth,
  name: 'create-company',
  displayName: 'Create Company',
  description: 'Create a new company in the workspace',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the company',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A short description of the company',
      required: false,
    }),
    fundingRaised: Property.Number({
      displayName: 'Funding Raised',
      description: 'The amount of funding raised by the company in USD',
      required: false,
    }),
    lastFundingDate: Property.ShortText({
      displayName: 'Last Funding Date',
      description: 'The date of the last funding round for the company, in YYYY-MM-DD format',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'The industry the company operates in',
      required: false,
    }),
    foundationYear: Property.ShortText({
      displayName: 'Foundation Year',
      description: 'The foundation year of the company, in YYYY format as string',
      required: false,
    }),
    employeeRange: Property.StaticDropdown({
      displayName: 'Employee Range',
      description: 'The employee range of the company',
      required: false,
      options: {
        options: [
          { label: '1-10', value: '1-10' },
          { label: '11-50', value: '11-50' },
          { label: '51-200', value: '51-200' },
          { label: '201-500', value: '201-500' },
          { label: '501-1000', value: '501-1000' },
          { label: '1001-5000', value: '1001-5000' },
          { label: '5001-10000', value: '5001-10000' },
          { label: '10000+', value: '10000+' },
        ],
      },
    }),
    groups: Property.Array({
      displayName: 'Groups',
      description: 'The groups to add the company to. Provide group IDs',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      description: 'A list of addresses associated with the company. The first address will be the primary address',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'A list of email addresses associated with the company. The first email will be the primary email',
      required: false,
    }),
    phones: Property.Array({
      displayName: 'Phones',
      description: 'A list of phone numbers associated with the company. The first phone will be the primary phone',
      required: false,
    }),
    urls: Property.Array({
      displayName: 'URLs',
      description: 'A list of URLs associated with the company. The first URL will be the primary URL',
      required: false,
    }),
    customFieldValues: Property.Object({
      displayName: 'Custom Field Values',
      description: 'The custom field values associated with the company, grouped by group ids',
      required: false,
    }),
  },
  async run(context) {
    const { name, description, fundingRaised, lastFundingDate, industry, foundationYear, employeeRange, groups, addresses, emails, phones, urls, customFieldValues } = context.propsValue;

    // Build the request body
    const body: Record<string, any> = {
      name,
    };

    // Add optional fields only if they are provided
    if (description) body['description'] = description;
    if (fundingRaised !== undefined && fundingRaised !== null) body['fundingRaised'] = fundingRaised;
    if (lastFundingDate) body['lastFundingDate'] = lastFundingDate;
    if (industry) body['industry'] = industry;
    if (foundationYear) body['foundationYear'] = foundationYear;
    if (employeeRange) body['employeeRange'] = employeeRange;
    
    // Handle array fields - convert to proper format
    if (groups && Array.isArray(groups) && groups.length > 0) {
      body['groups'] = groups.map(group => {
        // If the group is already an object with id, use it as is
        if (typeof group === 'object' && group !== null && 'id' in group) {
          return group;
        }
        // Otherwise, treat it as a group id string
        return { id: group };
      });
    }
    
    if (addresses && Array.isArray(addresses) && addresses.length > 0) {
      body['addresses'] = addresses;
    }
    
    if (emails && Array.isArray(emails) && emails.length > 0) {
      body['emails'] = emails;
    }
    
    if (phones && Array.isArray(phones) && phones.length > 0) {
      body['phones'] = phones;
    }
    
    if (urls && Array.isArray(urls) && urls.length > 0) {
      body['urls'] = urls;
    }
    
    if (customFieldValues) {
      body['customFieldValues'] = customFieldValues;
    }

    // Make the API call
    const response = await folkApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/companies',
      body,
    });

    return response;
  },
});
