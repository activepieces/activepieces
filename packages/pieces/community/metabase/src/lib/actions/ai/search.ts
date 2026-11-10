import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseSearchOutputSchema } from '../../output-schemas';

export const searchAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_search',
  outputSchema: metabaseSearchOutputSchema,
  displayName: 'Search',
  description: 'Search questions, dashboards, collections, tables and more.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Full-text search across Metabase items, returning ids, types and locations, one page at a time. Use it to find a card, dashboard, collection or table id by name.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({
      displayName: 'Search Text',
      description:
        'Text to search for. Empty = all items (filter by type instead).',
      required: false,
    }),
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
          { label: 'Table', value: 'table' },
          { label: 'Database', value: 'database' },
          { label: 'Segment', value: 'segment' },
          { label: 'Action', value: 'action' },
          { label: 'Document', value: 'document' },
        ],
      },
    }),
    collectionId: metabaseAiProps.collectionId({
      required: false,
      description:
        'Only search inside this collection, from List Collections. Empty = everywhere.',
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
    return await metabaseApi.search({
      auth,
      q: propsValue.q,
      models: propsValue.models,
      collectionId: propsValue.collectionId,
      archived: propsValue.archived,
      limit,
      offset: propsValue.offset,
    });
  },
});
