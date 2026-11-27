import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getFileRequestAction = createAction({
  auth: boxAuth,
  name: 'box_get_file_request',
  displayName: 'Get File Request',
  description: 'Gets the details of a Box file request.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one file request: title, description, status, required fields, expiry, its upload folder and public URL. File requests are made in the Box web app; its ID is the number at the end of the file request builder URL, or comes from Copy File Request.',
    idempotent: true,
  },
  props: {
    fileRequestId: boxAiProps.fileRequestId({
      required: true,
      description: 'The file request ID, e.g. "123": the number in the web app\'s file request builder URL (https://*.app.box.com/filerequest/123), or from Copy File Request.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/file_requests/${encodeURIComponent(propsValue.fileRequestId)}`,
    });
  },
});
