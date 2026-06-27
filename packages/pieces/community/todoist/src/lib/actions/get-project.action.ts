import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistGetProjectAction = createAction({
  auth: todoistAuth,
  name: 'todoist_get_project',
  displayName: 'Get Project',
  description: 'Get a single Todoist project by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches the full record of one Todoist project by its project_id. Use when you already have a project ID (e.g. from a task or List Projects) and need its current details; to find a project by name use Search Projects or List Projects instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'ID of the project to fetch. Resolve via List Projects or Search Projects.',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { project_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(project_id, 'project_id');

    return await todoistProjectsSectionsClient.projects.get(token, project_id);
  },
});
