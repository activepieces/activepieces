import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioBulkDeleteItemsOutputSchema } from '../../../output-schemas';

export const bulkDeleteItemsAction = createAction({
  auth: podioAuth,
  name: 'podio_bulk_delete_items',
  outputSchema: podioBulkDeleteItemsOutputSchema,
  displayName: 'Bulk Delete Items',
  description: 'Permanently deletes many items of an app at once, by id, saved view or filters.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes items of one app, chosen by item ids, or else by a saved view and/or filters; deleted items cannot be restored. Returns the ids deleted so far and those still pending. Item ids come from Filter Items, view ids from List Views; the app id from List Apps in Space.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
    itemIds: podioAiProps.idList({ required: false, displayName: 'Item IDs', description: 'Ids of the items to delete, from Filter Items. When set, View ID and Filters are ignored.' }),
    viewId: podioAiProps.id({ required: false, displayName: 'View ID', description: 'Deletes the items matching this saved view, from List Views.' }),
    filters: podioAiProps.json({ required: false, displayName: 'Filters', description: 'Deletes the items matching these filters, in the Filter Items format, e.g. {"status": [3]}.' }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    const itemIds = propsValue.itemIds?.length ? propsValue.itemIds.map((id) => Number(id)) : undefined;
    const filters = propsValue.filters && Object.keys(propsValue.filters).length > 0 ? propsValue.filters : undefined;
    if (!itemIds && !propsValue.viewId && !filters) {
      throw new Error('Set Item IDs, View ID or Filters to choose the items to delete.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/item/app/${propsValue.appId}/delete`,
      query: podioUtils.query({ values: { silent: propsValue.silent } }),
      body: podioUtils.body({
        values: {
          item_ids: itemIds,
          view_id: itemIds || !propsValue.viewId ? undefined : Number(propsValue.viewId),
          filters: itemIds ? undefined : filters,
        },
      }),
    });
  },
});
