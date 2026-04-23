import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deleteProject = createAction({
  auth: ninjapipeAuth,
  name: 'delete_project',
  displayName: 'Delete Project',
  description: 'Deletes a project by ID.',
  props: {
    projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/projects/${context.propsValue.projectId}` });
    return { success: true, deleted_id: context.propsValue.projectId };
  },
});
