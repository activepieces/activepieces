import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkOutputSchemas } from '../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { folkClient } from '../common/client';
import { folkLegacy } from '../common/legacy';
import { folkProps } from '../common/props';

export const updatePerson = createAction({
  auth: folkAuth,
  name: 'updatePerson',
  classification: 'WRITE',
  displayName: 'Update Person',
  description:
    'Update an existing person in your Folk workspace with new information.',
  audience: 'human',
  outputSchema: folkOutputSchemas.legacyPersonWrite,
  aiMetadata: {
    description: 'Updates fields on an existing Folk person identified by their person ID; only the fields you supply are changed, and supplied company names that do not yet exist are created. Use when you already know the target person ID (look it up first with List People or Get Person). Not idempotent in general: re-running mutates the record each call and supplied arrays replace prior values, so resubmitting the same input is not guaranteed to be a no-op.',
    idempotent: false,
  },
  props: {
    personId: folkProps.person_id(true),
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
    companyIds: folkProps.companyIds(false),
    companyNames: Property.Array({
      displayName: 'Company Names',
      description:
        "Company names to create or associate with. Companies will be created if they don't exist.",
      required: false,
      properties: {
        value: Property.ShortText({
          displayName: 'Company Name',
          required: true,
        }),
      },
    }),
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
    const { personId, ...props } = context.propsValue;
    const body = folkLegacy.personBody({ props });
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update. Fill in at least one field to change.');
    }
    const data = await folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/v1/people/${folkClient.idSegment({ value: String(personId ?? ''), label: 'Person' })}`,
      body,
    });
    return { data, success: true };
  },
});
