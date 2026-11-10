import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const updateAppOrderAction = createAction({
  auth: podioAuth,
  name: 'podio_update_app_order',
  displayName: 'Update App Order',
  description: 'Sets the order of the apps in a workspace navigator.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the navigator order of the apps in a Podio workspace. Pass every app id of the workspace, in the new order; read them first with List Apps in Space. The space id comes from List Organizations or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace.' }),
    appIds: podioAiProps.idList({ required: true, displayName: 'App IDs', description: 'All app ids of the workspace, in the order they should appear.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/app/space/${propsValue.spaceId}/order`,
      body: propsValue.appIds.map(Number),
    });
  },
});
