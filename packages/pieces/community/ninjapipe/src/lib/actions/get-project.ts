import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getProject = createAction({
  auth: ninjapipeAuth,
  name: 'get_project',
  displayName: 'Get Project',
  description: 'Retrieves a project by ID.',
  props: {
    projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/projects/${context.propsValue.projectId}` });
    return flattenCustomFields(response.body);
  },
});
