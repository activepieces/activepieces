import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const getCompanyAi = createAction({
  auth: folkAuth,
  name: 'get_company_ai',
  displayName: 'Get Company',
  description: 'Get one Folk company by ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: folkOutputSchemas.company,
  aiMetadata: {
    description:
      'Returns one Folk company by ID (com_...): name, description, industry, employee range, foundation year, funding, emails, phones, URLs, addresses, groups and custom field values. Use Search Companies to find the ID from a name. Read-only.',
    idempotent: true,
  },
  props: {
    companyId: folkAi.idProp({ displayName: 'Company ID', description: 'ID of the company (com_...).' }),
  },
  async run(context) {
    return folkClient.getData<Record<string, unknown>>({
      auth: context.auth,
      path: `/v1/companies/${folkClient.idSegment({ value: context.propsValue.companyId, label: 'Company ID' })}`,
    });
  },
});
