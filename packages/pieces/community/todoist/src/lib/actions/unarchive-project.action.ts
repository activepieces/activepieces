import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistUnarchiveProjectAction = createAction({
  auth: todoistAuth,
  name: 'todoist_unarchive_project',
  displayName: 'Unarchive Project',
  description: 'Restore an archived Todoist project to active.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Restores an archived Todoist project back to the active project list, identified by project_id. Use to bring back a project found via List Archived Projects; unarchiving an already-active project has no effect. Idempotent: re-running leaves the project active.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'ID of the archived project to restore. Resolve via List Archived Projects.',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { project_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(project_id, 'project_id');

    await todoistProjectsSectionsClient.projects.unarchive(token, project_id);
    return { success: true, project_id };
  },
});
