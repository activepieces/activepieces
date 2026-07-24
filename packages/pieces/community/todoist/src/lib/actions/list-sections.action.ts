import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistRestClient } from '../common/client/rest-client';
import { todoistAuth } from '../..';

export const todoistListSectionsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_sections',
  displayName: 'List Sections',
  description: 'List Todoist sections, optionally filtered to one project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Todoist sections with id, name and project_id, optionally restricted to a single project via project_id (all sections across all projects if left blank). Use to resolve a section name to its ID before a section-scoped operation; to match by a name fragment use Search Sections, for archived ones use List Archived Sections. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'Restrict to sections in this project. Resolve via List Projects. Leave blank to list sections across all projects.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { project_id } = context.propsValue;
    assertNotNullOrUndefined(token, 'token');

    const sections = await todoistRestClient.sections.list({ token, project_id });
    return {
      sections,
      count: sections.length,
    };
  },
});
