import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListCollectionItemsOutputSchema } from '../../output-schemas';

export const listCollectionItemsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_collection_items',
  outputSchema: metabaseListCollectionItemsOutputSchema,
  displayName: 'List Collection Items',
  description:
    'List the questions, dashboards and sub-collections inside a collection.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists what is inside a collection (questions, models, dashboards, sub-collections, snippets), one page at a time; leave Collection ID empty for the root. Use Offset with the returned total to page.',
    idempotent: true,
  },
  props: {
    collectionId: metabaseAiProps.collectionId({ required: false }),
    models: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'Only return this type of item. Empty = all types.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Question', value: 'card' },
          { label: 'Model', value: 'dataset' },
          { label: 'Metric', value: 'metric' },
          { label: 'Dashboard', value: 'dashboard' },
          { label: 'Collection', value: 'collection' },
          { label: 'Snippet', value: 'snippet' },
          { label: 'Timeline', value: 'timeline' },
        ],
      },
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description: 'Yes = only trashed items. Empty = active items.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return. Defaults to 50.',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of items to skip, for the next page. Defaults to 0.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = propsValue.limit ?? 50;
    if (limit < 1) {
      throw new Error('Limit must be at least 1.');
    }
    return await metabaseApi.listCollectionItems({
      auth,
      collectionId: propsValue.collectionId ?? 'root',
      models: propsValue.models,
      archived: propsValue.archived,
      limit,
      offset: propsValue.offset,
    });
  },
});
