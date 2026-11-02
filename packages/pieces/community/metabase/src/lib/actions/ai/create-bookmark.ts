import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateBookmarkOutputSchema } from '../../output-schemas';

export const createBookmarkAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_bookmark',
  outputSchema: metabaseCreateBookmarkOutputSchema,
  displayName: 'Create Bookmark',
  description: 'Bookmark a question, dashboard, collection or document.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Bookmarks an item for the connection's user. Fails if it is already bookmarked.",
    idempotent: false,
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
    return await metabaseApi.createBookmark({
      auth,
      model: propsValue.model,
      itemId: propsValue.itemId,
    });
  },
});
