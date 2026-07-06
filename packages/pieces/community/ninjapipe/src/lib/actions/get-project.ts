import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getProject = createAction({
  auth: ninjapipeAuth,
  name: 'get_project',
  displayName: 'Get Project',
  description: 'Retrieves a project by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single project by its ID. Read-only lookup for inspecting one project; to enumerate or search projects use the list-projects action instead.', idempotent: true },
  props: {
    projectId: ninjapipeCommon.projectDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/projects/${encodeURIComponent(String(context.propsValue.projectId))}` });
    return flattenCustomFields(response.body);
  },
});
