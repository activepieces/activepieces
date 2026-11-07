import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemByExternalIdOutputSchema } from '../../../output-schemas';

export const getItemByExternalIdAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_by_external_id',
  outputSchema: podioGetItemByExternalIdOutputSchema,
  displayName: 'Get Item by External ID',
  description: 'Gets a Podio item by the external id it was given.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a Podio item by the external id set with Create Item or Update Item. If several items in the app share the external id, Podio returns just one of them. The app id comes from List Apps in Space or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
    externalId: podioAiProps.text({ required: true, displayName: 'External ID', description: 'The external id of the item.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/app/${propsValue.appId}/external_id/${encodeURIComponent(propsValue.externalId)}` });
  },
});
