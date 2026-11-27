import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const removeFileSharedLinkAction = createAction({
  auth: boxAuth,
  name: 'box_remove_file_shared_link',
  displayName: 'Remove File Shared Link',
  description: 'Removes the shared link of a Box file.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the file\'s shared link so the URL stops working; a new link from Set File Shared Link gets a different URL. Returns the file with shared_link null.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/files/${encodeURIComponent(propsValue.fileId)}`,
      query: { fields: 'shared_link' },
      body: { shared_link: null },
    });
  },
});
