import { createAction } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistListArchivedProjectsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_archived_projects',
  displayName: 'List Archived Projects',
  description: 'List archived Todoist projects.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the archived (personal) Todoist projects with id and name. Use to find an archived project so you can restore it with Unarchive Project; for active projects use List Projects instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const token = context.auth.access_token;
    assertNotNullOrUndefined(token, 'token');

    const projects = await todoistProjectsSectionsClient.projects.listArchived(token);
    return {
      projects,
      count: projects.length,
    };
  },
});
