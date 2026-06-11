import { createAction } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const getCompany = createAction({
  auth: folkAuth,
  name: 'getCompany',
  displayName: 'Get Company',
  description: 'Retrieve detailed information about a company from your Folk workspace.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetches the full record of a single Folk company by its company ID. Use when you already have the company ID and need its current details; if you only have a name or email, find the ID first with Find Company. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    companyId: folkProps.company_id(true),
  },
  async run(context) {
    const { companyId } = context.propsValue;

    const response = await folkClient.getCompany({
      apiKey: context.auth,
      companyId: companyId as string,
    });

    return {
      company: response.data,
    };
  },
});

