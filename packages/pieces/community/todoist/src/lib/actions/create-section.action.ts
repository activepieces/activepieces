import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistCreateSectionAction = createAction({
  auth: todoistAuth,
  name: 'todoist_create_section',
  displayName: 'Create Section',
  description: 'Create a new section within a Todoist project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new section with the given name inside a specific project, identified by project_id. Use to add a column/grouping to a project; resolve the project ID via List Projects first. Not idempotent: each call creates a separate section even with an identical name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new section.',
      required: true,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'ID of the project to add the section to. Resolve via List Projects or Search Projects.',
      required: true,
    }),
    order: Property.Number({
      displayName: 'Order',
      description: 'Order of the section among the other sections in the project (lower is higher).',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { name, project_id, order } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(name, 'name');
    assertNotNullOrUndefined(project_id, 'project_id');

    return await todoistProjectsSectionsClient.sections.create(token, {
      name,
      project_id,
      order: order ?? undefined,
    });
  },
});
