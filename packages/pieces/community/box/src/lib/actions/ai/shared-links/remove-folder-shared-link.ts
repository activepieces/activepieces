import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const removeFolderSharedLinkAction = createAction({
  auth: boxAuth,
  name: 'box_remove_folder_shared_link',
  displayName: 'Remove Folder Shared Link',
  description: 'Removes the shared link of a Box folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the folder\'s shared link so the URL stops working; a new link from Set Folder Shared Link gets a different URL. Returns the folder with shared_link null.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}`,
      query: { fields: 'shared_link' },
      body: { shared_link: null },
    });
  },
});
