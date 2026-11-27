import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const BOOLEANS = ['true', 'false'];

export const transferOwnedFoldersAction = createAction({
  auth: boxAuth,
  name: 'box_transfer_owned_folders',
  displayName: 'Transfer Owned Folders',
  description: 'Moves everything a Box user owns into another user\'s account.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Moves all files, folders and workflows owned by one user into a new folder named "<user>\'s Files and Folders" in another user\'s root, usually before Delete User. Needs admin rights; large transfers keep running after the response and cannot be polled. Get both IDs from List Users.',
    idempotent: false,
  },
  props: {
    userId: boxAiProps.userId({
      required: true,
      displayName: 'From User ID',
      description: 'ID of the user whose content is moved. Get it from List Users.',
    }),
    toUserId: boxAiProps.userId({
      required: true,
      displayName: 'To User ID',
      description: 'ID of the user who receives the content. Get it from List Users.',
    }),
    notify: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Notify',
      description: '"true" to email the users about the transfer.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.notify !== undefined && !BOOLEANS.includes(propsValue.notify)) {
      throw new Error('Notify must be "true" or "false".');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(propsValue.userId)}/folders/0`,
      query: { notify: propsValue.notify, fields: propsValue.fields },
      body: { owned_by: { id: propsValue.toUserId } },
    });
  },
});
