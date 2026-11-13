import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkOutputSchemas } from '../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { folkClient } from '../common/client';
import { folkLegacy } from '../common/legacy';
import { folkProps } from '../common/props';

export const updateCompany = createAction({
  auth: folkAuth,
  name: 'updateCompany',
  classification: 'WRITE',
  displayName: 'Update Company',
  description: 'Update an existing company in your Folk workspace. Select the company from the dropdown to update its details.',
  audience: 'human',
  outputSchema: folkOutputSchemas.legacyCompanyWrite,
  aiMetadata: {
    description: 'Updates fields on an existing Folk company identified by its company ID; only the fields you supply are changed. Use when you already know the target company ID (look it up first with Find Company or Get Company). Not idempotent in general: re-running mutates the record on each call and supplied arrays such as emails or groups replace prior values, so resubmitting the same input is not guaranteed to be a no-op.',
    idempotent: false,
  },
  props: {
    companyId: folkProps.company_id(true),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A short description of the company',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'The industry the company operates in',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      description: 'Physical addresses for the company. The first address is primary.',
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
      description: 'Email addresses for the company. The first email is primary.',
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
      description: 'Phone numbers for the company. The first phone is primary.',
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
      description: 'Website URLs for the company. The first URL is primary.',
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
    const { companyId, ...props } = context.propsValue;
    const body = folkLegacy.companyBody({ props });
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update. Fill in at least one field to change.');
    }
    const company = await folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/v1/companies/${folkClient.idSegment({ value: String(companyId ?? ''), label: 'Company' })}`,
      body,
    });
    return { company, success: true };
  },
});
