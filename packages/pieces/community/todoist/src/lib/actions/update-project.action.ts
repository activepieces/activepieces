import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistUpdateProjectAction = createAction({
  auth: todoistAuth,
  name: 'todoist_update_project',
  displayName: 'Update Project',
  description: 'Update an existing Todoist project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates fields (name, color, view style, description, favorite flag) on an existing Todoist project identified by project_id. Use to edit a project once you have its ID (resolve via List Projects or Search Projects); only the fields you pass change. Idempotent: re-sending the same values overwrites to the same end state. Cannot reparent a project — use Move Task for tasks, not this.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'ID of the project to update. Resolve via List Projects or Search Projects.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the project.',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description:
        "New color of the project icon. A Todoist color name, e.g. 'berry_red', 'blue', 'charcoal'.",
      required: false,
    }),
    view_style: Property.StaticDropdown({
      displayName: 'View Style',
      description: 'How the project is displayed in Todoist.',
      required: false,
      options: {
        options: [
          { label: 'List', value: 'list' },
          { label: 'Board', value: 'board' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description for the project.',
      required: false,
    }),
    is_favorite: Property.Checkbox({
      displayName: 'Is Favorite',
      description: 'Whether the project is marked as a favorite.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { project_id, name, color, view_style, description, is_favorite } =
      context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(project_id, 'project_id');

    return await todoistProjectsSectionsClient.projects.update(token, project_id, {
      name,
      color,
      view_style,
      description,
      is_favorite,
    });
  },
});
