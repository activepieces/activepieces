import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteFileRequestAction = createAction({
  auth: boxAuth,
  name: 'box_delete_file_request',
  displayName: 'Delete File Request',
  description: 'Permanently deletes a Box file request.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a file request for good, so its URL stops working; files already uploaded stay in their folder. To pause it instead, set status "inactive" with Update File Request. Get the ID from Get File Request or Copy File Request.',
    idempotent: false,
  },
  props: {
    fileRequestId: boxAiProps.fileRequestId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/file_requests/${encodeURIComponent(propsValue.fileRequestId)}`,
    });
    return { deleted: true, fileRequestId: propsValue.fileRequestId };
  },
});
