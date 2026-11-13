import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteBookmarkOutputSchema } from '../../output-schemas';

export const deleteBookmarkAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_bookmark',
  outputSchema: metabaseDeleteBookmarkOutputSchema,
  displayName: 'Delete Bookmark',
  description: 'Remove a bookmark.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Removes the connection user's bookmark from an item; the item itself is untouched.",
    idempotent: true,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Item Type',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Question', value: 'card' },
          { label: 'Dashboard', value: 'dashboard' },
          { label: 'Collection', value: 'collection' },
          { label: 'Document', value: 'document' },
        ],
      },
    }),
    itemId: Property.Number({
      displayName: 'Item ID',
      description:
        'Numeric ID of the item, from Search or the matching List action.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteBookmark({
      auth,
      model: propsValue.model,
      itemId: propsValue.itemId,
    });
    return {
      deleted: true,
      model: propsValue.model,
      itemId: propsValue.itemId,
    };
  },
});
