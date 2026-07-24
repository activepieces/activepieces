import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistLabelsClient } from '../common/client/labels-client';
import { todoistAuth } from '../..';

export const todoistUpdateLabelAction = createAction({
  auth: todoistAuth,
  name: 'todoist_update_label',
  displayName: 'Update Label',
  description: 'Updates an existing personal label in Todoist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates fields (name, color, order, favorite flag) on an existing personal Todoist label identified by label_id; only the fields you pass are changed. Resolve label_id first via List Labels or Search Labels. To rename a shared (workspace) label across all tasks use Rename Shared Label instead. Idempotent: re-sending the same values yields the same end state.',
    idempotent: true,
  },
  props: {
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the personal label to update. Obtain it via List Labels or Search Labels.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New label name. Between 1 and 128 characters.',
      required: false,
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
    const { label_id, name, color, order, is_favorite } = propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(label_id, 'label_id');
    return await todoistLabelsClient.update({
      token,
      label_id,
      name,
      color,
      order,
      is_favorite,
    });
  },
});
