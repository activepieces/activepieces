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
      'Returns one Folk company by ID.(per_...): names, job title, emails, phones, URLs, addresses, companies, groups, custom field values and interaction stats. Use Search People to find the ID from a name or email. Read-only.',
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
