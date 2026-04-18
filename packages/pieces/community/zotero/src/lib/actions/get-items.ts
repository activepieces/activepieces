import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoteroAuth } from '../../index';
import { makeZoteroRequest, ZoteroItem } from '../common/client';

export const getItems = createAction({
  name: 'get_items',
  displayName: 'Get Items',
  description: 'Retrieve items from your Zotero library.',
  auth: zoteroAuth,
  props: {
    collection_key: Property.ShortText({
      displayName: 'Collection Key (optional)',
      description: 'Filter items by a specific collection key.',
      required: false,
    }),
    item_type: Property.ShortText({
      displayName: 'Item Type (optional)',
      description: 'Filter by type, e.g. journalArticle, book, webpage.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of items to return (max 100).',
      required: false,
      defaultValue: 25,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      defaultValue: 'dateModified',
      options: {
        options: [
          { label: 'Date Modified', value: 'dateModified' },
          { label: 'Date Added', value: 'dateAdded' },
          { label: 'Title', value: 'title' },
          { label: 'Creator', value: 'creator' },
          { label: 'Date', value: 'date' },
        ],
      },
    }),
  },
  async run(context) {
    const { api_key, user_or_group, library_id } = context.auth.props;
    const queryParams: Record<string, string> = {
      limit: String(Math.min(context.propsValue.limit ?? 25, 100)),
      sort: context.propsValue.sort ?? 'dateModified',
      direction: 'desc',
    };
    if (context.propsValue.item_type) queryParams['itemType'] = context.propsValue.item_type;

    const endpoint = context.propsValue.collection_key
      ? `/collections/${context.propsValue.collection_key}/items`
      : '/items';

    const { body } = await makeZoteroRequest<ZoteroItem[]>({
      apiKey: api_key,
      userOrGroup: user_or_group,
      libraryId: library_id,
      method: HttpMethod.GET,
      endpoint,
      params: queryParams,
    });
    return body;
  },
});
