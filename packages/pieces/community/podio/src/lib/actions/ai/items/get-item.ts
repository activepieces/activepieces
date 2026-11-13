import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetItemOutputSchema } from '../../../output-schemas';

export const getItemAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item',
  outputSchema: podioGetItemOutputSchema,
  displayName: 'Get Item',
  description: 'Gets one Podio item with its field values, comments, files and tags.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio item by item id: its field values, title, app, revisions, comments, files, tags and link. The item id comes from Filter Items, Find Referenceable Items or Create Item; use Get Item by App Item ID or Get Item by External ID when only those ids are known.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
    markAsViewed: podioAiProps.bool({ required: false, displayName: 'Mark as Viewed', description: '"false" leaves new notifications on the item unread. Defaults to "true".' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}`, query: podioUtils.query({ values: { mark_as_viewed: propsValue.markAsViewed } }) });
  },
});
