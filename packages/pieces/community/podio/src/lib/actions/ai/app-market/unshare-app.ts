import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const unshareAppAction = createAction({
  auth: podioAuth,
  name: 'podio_unshare_app',
  displayName: 'Unshare App',
  description: 'Removes a share from the app market.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes a Podio app market share so it can no longer be installed; apps already installed from it stay. It cannot be restored, only shared again with Share App. The share id comes from Get Own Shares.',
    idempotent: false,
  },
  props: {
    shareId: podioAiProps.id({ required: true, displayName: 'Share ID', description: 'The id of the share, from Get Own Shares.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/app_store/${propsValue.shareId}` });
  },
});
