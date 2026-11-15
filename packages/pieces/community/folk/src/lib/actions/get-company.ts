import { createAction } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkOutputSchemas } from '../output-schemas';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const getCompany = createAction({
  auth: folkAuth,
  name: 'getCompany',
  classification: 'READ',
  displayName: 'Get Company',
  description: 'Retrieve detailed information about a company from your Folk workspace.',
  audience: 'human',
  outputSchema: folkOutputSchemas.legacyCompanyGet,
  aiMetadata: {
    description: 'Fetches the full record of a single Folk company by its company ID. Use when you already have the company ID and need its current details; if you only have a name or email, find the ID first with Find Company. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    companyId: folkProps.company_id(true),
  },
  async run(context) {
    const company = await folkClient.getData<Record<string, unknown>>({
      auth: context.auth,
      path: `/v1/companies/${folkClient.idSegment({ value: String(context.propsValue.companyId ?? ''), label: 'Company' })}`,
    });
    return { company };
  },
});
