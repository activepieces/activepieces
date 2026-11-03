import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipePipelines } from '../common/pipelines';
import { ninjapipeSchemas } from '../output-schemas';

export const createPipeline = createAction({
  auth: ninjapipeAuth,
  name: 'create_pipeline',
  classification: 'WRITE',
  displayName: 'Create Pipeline',
  description: 'Creates a pipeline (board) with its stages.',
  audience: 'both',
  aiMetadata: {
    description: 'Create a NinjaPipe pipeline of type deals, contacts or general with an ordered list of stages (each needs a name; id and hex color are optional and generated when missing). Not idempotent: each call creates another pipeline.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.pipeline,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    pipelineType: Property.StaticDropdown({
      displayName: 'Pipeline Type',
      description: 'What this pipeline tracks.',
      required: true,
      defaultValue: 'general',
      options: {
        options: [
          { label: 'Contacts', value: 'contacts' },
          { label: 'Deals', value: 'deals' },
          { label: 'General', value: 'general' },
        ],
      },
    }),
    stages: Property.Array({
      displayName: 'Stages',
      description: 'Stages in board order. Add at least one.',
      required: true,
      properties: {
        name: Property.ShortText({ displayName: 'Name', description: 'Name shown on the board.', required: true }),
        id: Property.ShortText({ displayName: 'ID', description: 'Optional stable ID, e.g. "won". Generated from the name when empty.', required: false }),
        color: Property.ShortText({ displayName: 'Color', description: 'Optional hex color, e.g. #3b82f6.', required: false }),
      },
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: Property.ShortText({ displayName: 'Status', description: 'e.g. Active.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = ninjapipeFields.compact({
      name: p.name,
      pipeline_type: p.pipelineType,
      stages: ninjapipePipelines.toStages(p.stages),
      description: p.description,
      status: p.status,
    });
    return ninjapipeClient.sendRecord({ auth: ninjapipeClient.readAuth(context.auth), method: HttpMethod.POST, path: '/pipelines', body, operation: 'create pipeline' });
  },
});
