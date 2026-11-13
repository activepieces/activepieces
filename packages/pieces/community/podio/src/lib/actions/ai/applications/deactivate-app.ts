import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deactivateAppAction = createAction({
  auth: podioAuth,
  name: 'podio_deactivate_app',
  displayName: 'Deactivate App',
  description: 'Deactivates an app: it leaves the app navigator and no new items can be added.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Deactivates a Podio app without deleting it: the app leaves the app navigator and stops accepting new items, and existing items are kept. Reverse it with Activate App. The app id comes from List Apps, List Apps in Space or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app to deactivate.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/app/${propsValue.appId}/deactivate` });
  },
});
