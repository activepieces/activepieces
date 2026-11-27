import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCopyFolderOutputSchema } from '../../../output-schemas';

export const getFolderAction = createAction({
  auth: boxAuth,
  name: 'box_get_folder',
  outputSchema: boxCopyFolderOutputSchema,
  displayName: 'Get Folder',
  description: 'Gets the details of a Box folder.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Box folder\'s details: name, parent, path, owner, size, etag, shared link and its first items. Use List Folder Items to page through the contents. Folder "0" is the root; get other IDs from List Folder Items, Search or Create Folder.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
