import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiGetCompany = createAction({
  auth: ninjapipeAuth,
  name: 'ai_get_company',
  classification: 'READ',
  displayName: 'Get Company',
  description: 'Gets one company by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch one NinjaPipe company by company_id, with its custom fields. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.company,
  props: {
    company_id: ninjapipeAiProps.id({ displayName: 'Company ID', description: 'NinjaPipe company UUID, from ai_search_companies.' }),
  },
  async run(context) {
    return ninjapipeClient.getRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/companies/${ninjapipeClient.pathId({ value: context.propsValue.company_id, field: 'Company ID' })}`,
      operation: 'get company',
    });
  },
});
