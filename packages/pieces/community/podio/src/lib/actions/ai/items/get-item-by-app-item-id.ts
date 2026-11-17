import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemByAppItemIdOutputSchema } from '../../../output-schemas';

export const getItemByAppItemIdAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_by_app_item_id',
  outputSchema: podioGetItemByAppItemIdOutputSchema,
  displayName: 'Get Item by App Item ID',
  description: 'Gets one Podio item by its number within its app.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio item by its app item id, the per-app sequence number shown in the item URL, and returns the same body as Get Item. The app id comes from List Apps in Space or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
    appItemId: podioAiProps.id({ required: true, displayName: 'App Item ID', description: 'The app_item_id of the item: its number within the app, as shown in the item URL.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/app/${propsValue.appId}/item/${propsValue.appItemId}` });
  },
});
