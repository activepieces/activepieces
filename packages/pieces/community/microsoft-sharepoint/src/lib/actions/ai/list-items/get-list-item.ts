import { createAction } from '@activepieces/pieces-framework';
import type { ListItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCreateListItemOutputSchema } from '../../../output-schemas';

export const getListItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_list_item',
  outputSchema: microsoftSharepointCreateListItemOutputSchema,
  displayName: 'Get List Item',
  description: 'Gets a SharePoint list item with its column values.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one SharePoint list item with its column values (fields), content type and dates. List List Items or Search returns the item IDs; use Get List Item File for the file behind a document library item.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    listItemId: microsoftSharePointAiProps.listItemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const item: ListItem = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}`
      )
      .expand('fields')
      .get();
    return item;
  },
});
