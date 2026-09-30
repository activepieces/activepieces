import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteProjectOutputSchema } from '../../output-schemas';

export const asanaDeleteProjectAction = createAction({
  auth: asanaAuth,
  name: 'delete_project',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Project',
  description: 'Delete an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a project; the API offers no restore, so treat it as permanent. Tasks that live only in this project may go with it, so move any you need first with Add Task to Project. To keep the project but hide it, use Update Project with Archived set to Yes instead. Not idempotent: repeating the call on the same project fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteProjectOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project to delete. Obtain it from List Projects or Search Workspace Objects.',
      required: true,
    }),
  },
  async run(context) {
    const project = context.propsValue.project.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/projects/${asanaUtils.pathSegment(project)}`,
      operation: 'Delete Project',
    });
    return { success: true, project_gid: project };
  },
});
