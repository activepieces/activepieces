import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistDeleteSectionAction = createAction({
  auth: todoistAuth,
  name: 'todoist_delete_section',
  displayName: 'Delete Section',
  description: 'Delete a Todoist section and all tasks inside it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a Todoist section identified by section_id AND every task within that section. Destructive — confirm the section is empty or that losing its tasks is intended before calling; to only rename a section use Update Section. Idempotent: deleting an already-removed section succeeds with no effect.',
    idempotent: true,
  },
  props: {
    section_id: Property.ShortText({
      displayName: 'Section ID',
      description: 'ID of the section to delete. Resolve via List Sections or Search Sections.',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { section_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(section_id, 'section_id');

    await todoistProjectsSectionsClient.sections.delete(token, section_id);
    return { success: true, section_id };
  },
});
