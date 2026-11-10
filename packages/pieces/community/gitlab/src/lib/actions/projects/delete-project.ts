import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requireText } from '../../common/props';
import { vendorMessage } from '../../common/secret-request';
import { deletedProjectOutputSchema } from '../../output-schemas-admin';

export const deleteProjectAction = createAction({
  auth: gitlabAuth,
  name: 'delete_project',
  displayName: 'Delete Project',
  description: 'Deletes a project. On gitlab.com it is marked for deletion and removed after the retention period.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Deletes a GitLab project with its repository, issues, merge requests and pipelines. On gitlab.com the project is first marked for deletion and removed after the retention period (an Owner can restore it in the UI until then). Requires the Owner role. Use Archive Project to make it read-only instead.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
  },
  outputSchema: deletedProjectOutputSchema,
  async run({ auth, propsValue }) {
    const projectId = requireText({ value: propsValue.projectId, label: 'Project ID or path' });
    const body = await gitlabRequest<unknown>({ auth,  method: 'DELETE', path: projectPath(projectId) });
    return { deletionRequested: true, projectId, message: vendorMessage(body) ?? null };
  },
});
