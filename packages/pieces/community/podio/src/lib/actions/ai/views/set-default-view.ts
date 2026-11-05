import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const setDefaultViewAction = createAction({
  auth: podioAuth,
  name: 'podio_set_default_view',
  displayName: 'Set Default View',
  description: 'Makes a saved view the default view of its app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a saved, active view the default view of its Podio app for all members; the user needs the right to update the app. The view id comes from List Views or Create View.',
    idempotent: true,
  },
  props: {
    viewId: podioAiProps.id({ required: true, displayName: 'View ID', description: 'The id of a saved view.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/view/${propsValue.viewId}/default` });
  },
});
