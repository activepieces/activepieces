import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistListArchivedSectionsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_archived_sections',
  displayName: 'List Archived Sections',
  description: 'List archived sections within a Todoist project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the archived sections inside one specific project, identified by project_id (required). Use to inspect a project\'s archived sections; for active sections use List Sections instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'ID of the project whose archived sections to list. Resolve via List Projects or Search Projects.',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { project_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(project_id, 'project_id');

    const sections = await todoistProjectsSectionsClient.sections.listArchived(
      token,
      project_id,
    );
    return {
      sections,
      count: sections.length,
    };
  },
});
