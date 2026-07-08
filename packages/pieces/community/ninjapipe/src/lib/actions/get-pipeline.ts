import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getPipeline = createAction({
  auth: ninjapipeAuth,
  name: 'get_pipeline',
  displayName: 'Get Pipeline',
  description: 'Retrieves a pipeline by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single NinjaPipe sales pipeline by its ID. Read-only lookup for inspecting one pipeline; to enumerate available pipelines use a list action instead.', idempotent: true },
  props: {
    pipelineId: ninjapipeCommon.pipelineDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/pipelines/${encodeURIComponent(String(context.propsValue.pipelineId))}` });
    return flattenCustomFields(response.body);
  },
});
