import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const getPipeline = createAction({
  auth: ninjapipeAuth,
  name: 'get_pipeline',
  classification: 'READ',
  displayName: 'Get Pipeline',
  description: 'Gets one pipeline by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single NinjaPipe pipeline by ID including its stages (stage IDs are used by pipeline items). Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.pipeline,
  props: {
    pipelineId: ninjapipeProps.pipelineRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.pipelineId, field: 'Pipeline' });
    return ninjapipeClient.getRecord({ auth: ninjapipeClient.readAuth(context.auth), path: `/pipelines/${id}`, operation: 'get pipeline' });
  },
});
