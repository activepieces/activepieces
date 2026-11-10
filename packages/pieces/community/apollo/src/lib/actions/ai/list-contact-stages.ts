import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiListContactStagesAction = createAction({
  auth: apolloAuth,
  name: 'ai_list_contact_stages',
  classification: 'SEARCH',
  displayName: 'List Contact Stages',
  description: 'List the contact stages in your Apollo workspace.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every contact stage (ID, name, order, category) defined in your Apollo workspace, for contact_stage_id in Create Contact, Update Contact and Search Contacts. Uses no credits.',
    idempotent: true,
  },
  props: {},
  outputSchema: apolloOutputSchemas.stages,
  async run({ auth }) {
    const body = await apolloRequests.listContactStages({ apiKey: apiKeyOf(auth) });
    return { stages: recordsOf(body['contact_stages']).map((stage) => apolloMappers.stage(stage)) };
  },
});
