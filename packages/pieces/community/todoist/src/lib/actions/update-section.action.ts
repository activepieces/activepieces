import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistUpdateSectionAction = createAction({
  auth: todoistAuth,
  name: 'todoist_update_section',
  displayName: 'Update Section',
  description: 'Rename an existing Todoist section.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames an existing Todoist section identified by section_id (rename is the only field the section update endpoint supports). Use once you have the section ID (resolve via List Sections or Search Sections); to move a section to a different project this endpoint cannot help. Idempotent: re-sending the same name leaves the section at the same end state.',
    idempotent: true,
  },
  props: {
    section_id: Property.ShortText({
      displayName: 'Section ID',
      description: 'ID of the section to rename. Resolve via List Sections or Search Sections.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the section.',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { section_id, name } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(section_id, 'section_id');
    assertNotNullOrUndefined(name, 'name');

    return await todoistProjectsSectionsClient.sections.update(token, section_id, {
      name,
    });
  },
});
