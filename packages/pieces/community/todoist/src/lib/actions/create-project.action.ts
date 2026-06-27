import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistProjectsSectionsClient } from '../common/client/projects-sections-client';
import { todoistAuth } from '../..';

export const todoistCreateProjectAction = createAction({
  auth: todoistAuth,
  name: 'todoist_create_project',
  displayName: 'Create Project',
  description: 'Create a new Todoist project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Todoist project with the given name and optional color, parent project, view style, description and favorite flag. Use to add a fresh project; to nest it under another project pass that project\'s ID as parent_id (resolve via List Projects). Not idempotent: each call creates a separate project even with an identical name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new project.',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description:
        "Color of the project icon. A Todoist color name, e.g. 'berry_red', 'blue', 'charcoal'.",
      required: false,
    }),
    parent_id: Property.ShortText({
      displayName: 'Parent Project ID',
      description:
        'ID of a parent project to nest this project under, making it a sub-project. Resolve the name to an ID via List Projects. Leave blank for a top-level project.',
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
      description: 'Description for the project.',
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
    const { name, color, parent_id, view_style, description, is_favorite } =
      context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    return await todoistProjectsSectionsClient.projects.create(token, {
      name,
      color,
      parent_id,
      view_style,
      description,
      is_favorite,
    });
  },
});
