import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getPipeline = createAction({
  auth: ninjapipeAuth,
  name: 'get_pipeline',
  displayName: 'Get Pipeline',
  description: 'Retrieves a pipeline by ID.',
  props: {
    pipelineId: Property.ShortText({ displayName: 'Pipeline ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/pipelines/${context.propsValue.pipelineId}` });
    return flattenCustomFields(response.body);
  },
});
