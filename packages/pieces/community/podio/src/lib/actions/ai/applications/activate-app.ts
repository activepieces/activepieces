import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const activateAppAction = createAction({
  auth: podioAuth,
  name: 'podio_activate_app',
  displayName: 'Activate App',
  description: 'Activates a deactivated app so it shows in the app navigator and accepts new items again.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Reactivates a Podio app that Deactivate App turned off, putting it back in the app navigator and allowing new items. The app id comes from List Apps, List Apps in Space or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app to activate.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/app/${propsValue.appId}/activate` });
  },
});
