import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const updatePipeline = createAction({
  auth: ninjapipeAuth,
  name: 'update_pipeline',
  displayName: 'Update Pipeline',
  description: 'Updates a pipeline by ID.',
  props: {
    pipelineId: ninjapipeCommon.pipelineDropdownRequired,
    name: Property.ShortText({ displayName: 'Name', required: false }),
    pipelineType: Property.StaticDropdown({
      displayName: 'Pipeline Type',
      required: false,
      options: {
        options: [
          { label: 'Contacts', value: 'contacts' },
          { label: 'Deals', value: 'deals' },
          { label: 'General', value: 'general' },
        ],
      },
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, unknown> = {};
    if (p.name) body['name'] = p.name;
    if (p.pipelineType) body['pipeline_type'] = p.pipelineType;
    if (p.description !== undefined) body['description'] = p.description;
    if (p.status) body['status'] = p.status;
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.PUT,
      path: `/pipelines/${encodeURIComponent(String(p.pipelineId))}`,
      body,
    });
    return flattenCustomFields(response.body);
  },
});
