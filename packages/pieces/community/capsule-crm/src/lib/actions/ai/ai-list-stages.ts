import { createAction } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { stagesOutputSchema } from '../../common/output-schemas';

export const aiListStages = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_list_stages',
  classification: 'READ',
  displayName: 'List Stages',
  description: 'Lists project stages.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the active project board stages with their numeric IDs; inactive stages are not returned. Use an id as Stage ID when creating projects. Read-only.',
    idempotent: true,
  },
  outputSchema: stagesOutputSchema,
  props: {

  },
  async run({ auth }) {
    return { stages: await capsuleCrmClient.listStages({ auth }) };
  },
});
