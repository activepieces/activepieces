import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const updatePipeline = createAction({
  auth: ninjapipeAuth,
  name: 'update_pipeline',
  classification: 'WRITE',
  displayName: 'Update Pipeline',
  description: 'Renames a pipeline or changes its type, description or status. Stages are not changed.',
  audience: 'both',
  aiMetadata: {
    description: 'Update a NinjaPipe pipeline by ID: name, type, description or status. Only filled fields change; stages stay as they are. Re-running with the same input gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.pipeline,
  props: {
    pipelineId: ninjapipeProps.pipelineRequired(),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    pipelineType: ninjapipeProps.staticDropdown({ displayName: 'Pipeline Type', description: 'What this pipeline tracks.', values: ['contacts', 'deals', 'general'] }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    clearFields: ninjapipeProps.clearFields({ fields: { description: 'Description' } }),
  },
  async run(context) {
    const p = context.propsValue;
    const path = `/pipelines/${ninjapipeClient.pathId({ value: p.pipelineId, field: 'Pipeline' })}`;
    const changes = ninjapipeFields.compact({ name: p.name, pipeline_type: p.pipelineType, description: p.description, status: p.status });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clearFields }), what: 'pipeline' });
    return ninjapipeClient.sendRecord({ auth: ninjapipeClient.readAuth(context.auth), method: HttpMethod.PUT, path, body, operation: 'update pipeline' });
  },
});
