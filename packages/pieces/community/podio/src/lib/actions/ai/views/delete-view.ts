import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteViewAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_view',
  displayName: 'Delete View',
  description: 'Deletes a saved view from an app.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a saved view of a Podio app; the app and its items are not touched. The view id comes from List Views or Create View.',
    idempotent: false,
  },
  props: {
    viewId: podioAiProps.id({ required: true, displayName: 'View ID', description: 'The id of the view to delete.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/view/${propsValue.viewId}` });
  },
});
