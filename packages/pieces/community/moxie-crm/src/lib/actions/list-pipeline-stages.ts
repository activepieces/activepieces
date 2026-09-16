import { createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../auth';
import { listPipelineStagesActionOutputSchema } from '../output-schemas';

export const moxieListPipelineStagesAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_pipeline_stages',
  classification: 'READ',
  displayName: 'List Pipeline Stages',
  description: 'Retrieve the opportunity pipeline stages of the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the Moxie pipeline stages, each with its id, label, colour and stage type (New, InProgress, OnHold, ClosedWon, ClosedLost or Complete). Use to resolve a stage id before creating or moving an opportunity. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listPipelineStagesActionOutputSchema,
  props: {},
  async run({ auth }) {
    const client = await makeClient(auth);
    return await client.listPipelineStages();
  },
});
