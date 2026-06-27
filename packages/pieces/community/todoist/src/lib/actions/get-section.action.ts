import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistGetSectionAction = createAction({
  auth: todoistAuth,
  name: 'todoist_get_section',
  displayName: 'Get Section',
  description: 'Get a single Todoist section by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches the full record of one Todoist section by its section_id (including its name and parent project_id). Use when you already have a section ID and need its current details; to find a section by name use Search Sections or List Sections instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    section_id: Property.ShortText({
      displayName: 'Section ID',
      description: 'ID of the section to fetch. Resolve via List Sections or Search Sections.',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { section_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(section_id, 'section_id');

    return await todoistProjectsSectionsClient.sections.get(token, section_id);
  },
});
