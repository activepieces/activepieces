import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getTrashedFolderAction = createAction({
  auth: boxAuth,
  name: 'box_get_trashed_folder',
  displayName: 'Get Trashed Folder',
  description: 'Gets the details of a Box folder in the trash.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a folder that was trashed directly, with when it was trashed and its original parent; fails with 404 for active folders (use Get Folder) and for folders trashed only as part of a parent. Get the ID from List Trashed Items.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true, description: 'ID of the trashed folder. Get it from List Trashed Items.' }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/trash`,
      query: { fields: propsValue.fields },
    });
  },
});
