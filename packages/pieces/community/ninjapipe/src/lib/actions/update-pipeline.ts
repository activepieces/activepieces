import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const updatePipeline = createAction({
  auth: ninjapipeAuth,
  name: 'update_pipeline',
  displayName: 'Update Pipeline',
  description: 'Updates a pipeline by ID.',
  props: {
    pipelineId: Property.ShortText({ displayName: 'Pipeline ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.name) body.name = p.name;
    if (p.description) body.description = p.description;
    if (p.status) body.status = p.status;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.PUT, path: `/pipelines/${p.pipelineId}`, body });
    return flattenCustomFields(response.body);
  },
});
