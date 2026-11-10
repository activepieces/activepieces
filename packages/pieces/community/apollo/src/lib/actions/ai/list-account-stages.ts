import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiListAccountStagesAction = createAction({
  auth: apolloAuth,
  name: 'ai_list_account_stages',
  classification: 'SEARCH',
  displayName: 'List Account Stages',
  description: 'List the account stages in your Apollo workspace.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every account stage (ID, name, order, category) defined in your Apollo workspace, for account_stage_id in Create Account, Update Account and Search Accounts. Uses no credits.',
    idempotent: true,
  },
  props: {},
  outputSchema: apolloOutputSchemas.stages,
  async run({ auth }) {
    const body = await apolloRequests.listAccountStages({ apiKey: apiKeyOf(auth) });
    return { stages: recordsOf(body['account_stages']).map((stage) => apolloMappers.stage(stage)) };
  },
});
