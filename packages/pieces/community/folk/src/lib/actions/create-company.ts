import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkOutputSchemas } from '../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { folkClient } from '../common/client';
import { folkLegacy } from '../common/legacy';
import { folkProps } from '../common/props';

export const createCompany = createAction({
  auth: folkAuth,
  name: 'createCompany',
  classification: 'WRITE',
  displayName: 'Create Company',
  description: 'Create a new company in your Folk workspace. You can add emails, links, phone numbers, and assign it to a group.',
  audience: 'human',
  outputSchema: folkOutputSchemas.legacyCompanyWrite,
  aiMetadata: {
    description: 'Creates a new company record in the Folk CRM, optionally attaching addresses, emails, phone numbers, URLs, an industry, and a group assignment. Use when a company does not yet exist in Folk; only the company name is required. Not idempotent: each call creates a separate company even with identical input, so guard against duplicates (e.g. search with Find Company first).',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company',
      required: true,
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
    const body = folkLegacy.companyBody({ props: context.propsValue });
    const company = await folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/companies',
      body,
    });
    return { company, success: true };
  },
});
