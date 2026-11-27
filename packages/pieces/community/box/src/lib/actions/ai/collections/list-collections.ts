import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listCollectionsAction = createAction({
  auth: boxAuth,
  name: 'box_list_collections',
  displayName: 'List Collections',
  description: 'Lists the user\'s Box collections.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the user\'s collections with their IDs; Box currently has only the "Favorites" collection. Use the ID with List Collection Items or Get Collection, or in Update File / Update Folder to add an item to it.',
    idempotent: true,
  },
  props: {
    limit: boxAiProps.limit({ required: false }),
    offset: boxAiProps.offset({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/collections',
      query: {
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
        fields: propsValue.fields,
      },
    });
  },
});
