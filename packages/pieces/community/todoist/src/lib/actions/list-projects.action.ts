import { createAction } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistRestClient } from '../common/client/rest-client';
import { todoistAuth } from '../..';

export const todoistListProjectsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_projects',
  displayName: 'List Projects',
  description: 'List all Todoist projects.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every Todoist project (active, not archived) with id and name. Use this to resolve a project name to its ID before any project-scoped operation, or to enumerate available projects; to match by a name fragment use Search Projects, for archived ones use List Archived Projects. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const token = context.auth.access_token;
    assertNotNullOrUndefined(token, 'token');

    const projects = await todoistRestClient.projects.list({ token });
    return {
      projects,
      count: projects.length,
    };
  },
});
