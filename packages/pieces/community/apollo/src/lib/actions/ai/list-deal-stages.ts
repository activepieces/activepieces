import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiListDealStagesAction = createAction({
  auth: apolloAuth,
  name: 'ai_list_deal_stages',
  classification: 'SEARCH',
  displayName: 'List Deal Stages',
  description: 'List the deal stages in your Apollo pipelines.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every deal stage (ID, name, pipeline, won/closed flags, probability) in your Apollo deal pipelines, for stage_id in Create Deal and Update Deal. Uses no credits.',
    idempotent: true,
  },
  props: {},
  outputSchema: apolloOutputSchemas.dealStages,
  async run({ auth }) {
    const body = await apolloRequests.listDealStages({ apiKey: apiKeyOf(auth) });
    return { stages: recordsOf(body['opportunity_stages']).map((stage) => apolloMappers.dealStage(stage)) };
  },
});
