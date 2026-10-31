import { createAction, Property } from '@activepieces/pieces-framework';
import type { ListItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointListListItemsOutputSchema } from '../../../output-schemas';

export const listListItemsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_list_items',
  outputSchema: microsoftSharepointListListItemsOutputSchema,
  displayName: 'List List Items',
  description: 'Lists the items of a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the items of a SharePoint list with their IDs, optionally with column values and narrowed by an OData filter, one page at a time. List Lists returns the list IDs; use Get List Item to read one item again.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    includeFields: Property.StaticDropdown({
      displayName: 'Include Column Values',
      description: 'Whether to return the column values (fields) of each item. Defaults to true.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    filter: Property.ShortText({
      displayName: 'Filter',
      description:
        'OData filter on item properties or columns, like "fields/Status eq \'Done\'". Supports eq, ne, lt, gt, le, ge and startswith; indexed columns are safest, as filtering a non-indexed column may fail on large lists.',
      required: false,
    }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    const includeFields = microsoftSharePointUtils.booleanChoice({
      value: propsValue.includeFields,
      propName: 'Include Column Values',
    });
    return await microsoftSharePointClient.list<ListItem>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
      query: {
        ...(includeFields === false ? {} : { $expand: 'fields' }),
        ...(propsValue.filter ? { $filter: propsValue.filter } : {}),
      },
      headers: propsValue.filter ? { Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly' } : {},
    });
  },
});
