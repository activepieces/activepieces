import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const createPipeline = createAction({
  auth: ninjapipeAuth,
  name: 'create_pipeline',
  displayName: 'Create Pipeline',
  description: 'Creates a new pipeline.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    pipelineType: Property.StaticDropdown({
      displayName: 'Pipeline Type',
      description: 'Required by NinjaPipe — what this pipeline tracks.',
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
      description: 'Pipeline stages. Add at least one. Color must be a hex like #3b82f6.',
      required: true,
      properties: {
        id: Property.ShortText({
          displayName: 'ID',
          description: 'Stable slug, e.g. "new", "won".',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Name',
          description: 'Display name shown on the board.',
          required: true,
        }),
        color: Property.ShortText({
          displayName: 'Color',
          description: 'Hex color, e.g. #3b82f6.',
          required: true,
        }),
      },
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    if (!Array.isArray(p.stages) || p.stages.length === 0) {
      throw new Error('Stages must contain at least one entry with id, name, and color.');
    }
    const stages = (p.stages as Array<{ id?: unknown; name?: unknown; color?: unknown }>).map((stage) => {
      if (!stage?.id || !stage.name || !stage.color) {
        throw new Error('Each stage requires id, name, and color.');
      }
      return { id: String(stage.id), name: String(stage.name), color: String(stage.color) };
    });
    const body: Record<string, unknown> = {
      name: p.name,
      pipeline_type: p.pipelineType,
      stages,
    };
    if (p.description) body['description'] = p.description;
    if (p.status) body['status'] = p.status;
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: '/pipelines',
      body,
    });
    return flattenCustomFields(response.body);
  },
});
