import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const deleteProject = createAction({
  auth: ninjapipeAuth,
  name: 'delete_project',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Project',
  description: 'Permanently deletes a project. Its tasks are removed with it.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete one NinjaPipe project by ID (projectId; get it from a list or search step). Cannot be undone. A second call fails with 404 because the project is gone.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deleted,
  props: {
    projectId: ninjapipeProps.projectRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.projectId, field: 'Project' });
    return ninjapipeClient.deleteRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/projects/${id}`,
      id: decodeURIComponent(id),
      operation: 'delete project',
    });
  },
});
