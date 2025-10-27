import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkApiCall } from '../common/client';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const updatePerson = createAction({
  auth: folkAuth,
  name: 'update-person',
  displayName: 'Update Person',
  description: 'Update an existing person in the workspace',
  props: {
    personId: Property.ShortText({
      displayName: 'Person ID',
      description: 'The ID of the person to update',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the person',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the person',
      required: false,
    }),
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: 'The full name of the person',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A short description of the person',
      required: false,
    }),
    birthday: Property.ShortText({
      displayName: 'Birthday',
      description: 'The birthday of the person, in YYYY-MM-DD format',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'The job title of the person',
      required: false,
    }),
    groups: Property.Array({
      displayName: 'Groups',
      description: 'The groups to add the person to. Provide group IDs. This will replace existing groups.',
      required: false,
    }),
    companies: Property.Array({
      displayName: 'Companies',
      description: 'The companies associated with the person. Provide objects with "name" or "id". This will replace existing companies.',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      description: 'A list of addresses associated with the person. The first address will be the primary address. This will replace existing addresses.',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'A list of email addresses associated with the person. The first email will be the primary email. This will replace existing emails.',
      required: false,
    }),
    phones: Property.Array({
      displayName: 'Phones',
      description: 'A list of phone numbers associated with the person. The first phone will be the primary phone. This will replace existing phones.',
      required: false,
    }),
    urls: Property.Array({
      displayName: 'URLs',
      description: 'A list of URLs associated with the person. The first URL will be the primary URL. This will replace existing URLs.',
      required: false,
    }),
    customFieldValues: Property.Object({
      displayName: 'Custom Field Values',
      description: 'The custom field values associated with the person, grouped by group ids',
      required: false,
    }),
  },
  async run(context) {
    const { personId, firstName, lastName, fullName, description, birthday, jobTitle, groups, companies, addresses, emails, phones, urls, customFieldValues } = context.propsValue;

    // Validate inputs
    await propsValidation.validateZod(context.propsValue, {
      personId: z.string().min(1, 'Person ID is required'),
      birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be in YYYY-MM-DD format').optional(),
      emails: z.array(
        z.union([
          z.string().email('Each email must be a valid email address'),
          z.object({
            email: z.string().email('Email must be valid'),
            type: z.string().optional(),
            isPrimary: z.boolean().optional(),
          })
        ])
      ).optional(),
      phones: z.array(
        z.union([
          z.string().min(1, 'Phone number cannot be empty'),
          z.object({
            phone: z.string().min(1, 'Phone number is required'),
            type: z.string().optional(),
            isPrimary: z.boolean().optional(),
          })
        ])
      ).optional(),
      urls: z.array(
        z.union([
          z.string().url('Each URL must be a valid URL'),
          z.object({
            url: z.string().url('URL must be valid'),
            type: z.string().optional(),
            isPrimary: z.boolean().optional(),
          })
        ])
      ).optional(),
    });

    // Build the request body with only provided fields
    const body: Record<string, any> = {};

    // Add optional fields only if they are provided
    if (firstName) body['firstName'] = firstName;
    if (lastName) body['lastName'] = lastName;
    if (fullName) body['fullName'] = fullName;
    if (description) body['description'] = description;
    if (birthday) body['birthday'] = birthday;
    if (jobTitle) body['jobTitle'] = jobTitle;
    
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
    
    if (companies && Array.isArray(companies) && companies.length > 0) {
      body['companies'] = companies.map(company => {
        // If the company is already an object, use it as is
        if (typeof company === 'object' && company !== null) {
          return company;
        }
        // Otherwise, treat it as a company name string
        return { name: company };
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
      method: HttpMethod.PATCH,
      endpoint: `/people/${personId}`,
      body,
    });

    return response;
  },
});
