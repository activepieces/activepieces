import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistLabelsClient } from '../common/client/labels-client';
import { todoistAuth } from '../..';

export const todoistCreateLabelAction = createAction({
  auth: todoistAuth,
  name: 'todoist_create_label',
  displayName: 'Create Label',
  description: 'Creates a new personal label in Todoist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new personal Todoist label by name (1-128 chars), with optional color, order, and favorite flag. Use to add a label before tagging tasks with it; to change an existing label use Update Label instead. Not idempotent: a duplicate name returns an error, so call List Labels first to check whether the label already exists.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The label name. Between 1 and 128 characters.',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description:
        "The label's color, as a Todoist color name (e.g. 'berry_red', 'blue', 'charcoal').",
      required: false,
    }),
    order: Property.Number({
      displayName: 'Order',
      description: 'Number used to sort the label in the list view (lower comes first).',
      required: false,
    }),
    is_favorite: Property.Checkbox({
      displayName: 'Is Favorite',
      description: 'Whether the label is marked as a favorite.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth.access_token;
    const { name, color, order, is_favorite } = propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(name, 'name');
    return await todoistLabelsClient.create({
      token,
      name,
      color,
      order,
      is_favorite,
    });
  },
});
