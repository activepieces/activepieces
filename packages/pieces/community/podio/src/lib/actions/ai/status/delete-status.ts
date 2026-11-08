import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteStatusAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_status',
  displayName: 'Delete Status',
  description: 'Permanently deletes a status message.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one Podio status message so nobody can see it again; it cannot be restored. The status id comes from Create Status or a stream action such as Get Space Stream.',
    idempotent: false,
  },
  props: {
    statusId: podioAiProps.id({ required: true, displayName: 'Status ID', description: 'The id of the status message to delete.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/status/${propsValue.statusId}` });
  },
});
