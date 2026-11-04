import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkOutputSchemas } from '../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { folkClient } from '../common/client';
import { folkLegacy } from '../common/legacy';
import { folkProps } from '../common/props';

export const createPerson = createAction({
  auth: folkAuth,
  name: 'createPerson',
  classification: 'WRITE',
  displayName: 'Create Person',
  description:
    'Create a new person in your Folk workspace. You can link them to a company, add contact details, and assign to a group.',
  audience: 'human',
  outputSchema: folkOutputSchemas.legacyPersonCreate,
  aiMetadata: {
    description: 'Creates a new person (contact) record in the Folk CRM, optionally linking them to companies by ID or name, setting a job title and birthday, and adding emails, phones, addresses, URLs, and a group. Use to add a new contact when none exists; provide a name via first/last or full name. Not idempotent: each call creates a separate person, so check for existing contacts first to avoid duplicates.',
    idempotent: false,
  },
  props: {
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
      description: 'The full name of the person (alternative to first/last)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A short description of the person',
      required: false,
    }),
    birthday: Property.ShortText({
      displayName: 'Birthday',
      description: 'The birthday in YYYY-MM-DD format',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'The job title of the person',
      required: false,
    }),
    companyNames: Property.Array({
      displayName: 'Company Names',
      description:
        'The names of companies to associate with the person. The first company will be primary.',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Company Name',
          required: true,
        }),
      },
    }),
    companyIds: folkProps.companyIds(false),
    addresses: Property.Array({
      displayName: 'Addresses',
      description:
        'Physical addresses for the person. The first address is primary.',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Address',
          required: true,
        }),
      },
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description:
        'Email addresses for the person. The first email is primary.',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
      },
    }),
    phones: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Phone numbers for the person. The first phone is primary.',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Phone Number',
          required: true,
        }),
      },
    }),
    urls: Property.Array({
      displayName: 'URLs',
      description: 'Website URLs for the person. The first URL is primary.',
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'URL',
          required: true,
        }),
      },
    }),
    groupId: folkProps.group_id(false, 'Group ID'),
  },
  async run(context) {
    const body = folkLegacy.personBody({ props: context.propsValue });
    return folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/people',
      body,
    });
  },
});
