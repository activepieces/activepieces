import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteProject = createAction({
  auth: ninjapipeAuth,
  name: 'delete_project',
  displayName: 'Delete Project',
  description: 'Deletes a project by ID.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a project identified by Project ID, including its tasks. Pick this to remove a project entirely; the change is destructive and cannot be undone. Re-running after deletion typically fails since the ID no longer exists.', idempotent: false },
  props: {
    projectId: ninjapipeCommon.projectDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.DELETE, path: `/projects/${encodeURIComponent(String(context.propsValue.projectId))}` });
    return { success: true, deleted_id: context.propsValue.projectId };
  },
});
