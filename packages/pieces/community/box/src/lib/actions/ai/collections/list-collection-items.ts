import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listCollectionItemsAction = createAction({
  auth: boxAuth,
  name: 'box_list_collection_items',
  displayName: 'List Collection Items',
  description: 'Lists the files, folders and web links in a Box collection.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the files, folders and web links in a collection such as Favorites, with their IDs and types. Get the collection ID from List Collections. Page with Offset.',
    idempotent: true,
  },
  props: {
    collectionId: boxAiProps.collectionId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    offset: boxAiProps.offset({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/collections/${encodeURIComponent(propsValue.collectionId)}/items`,
      query: {
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
        fields: propsValue.fields,
      },
    });
  },
});
