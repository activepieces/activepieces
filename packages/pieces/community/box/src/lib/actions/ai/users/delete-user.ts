import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteUserOutputSchema } from '../../../output-schemas';

const BOOLEANS = ['true', 'false'];

export const deleteUserAction = createAction({
  auth: boxAuth,
  name: 'box_delete_user',
  outputSchema: boxDeleteUserOutputSchema,
  displayName: 'Delete User',
  description: 'Permanently deletes a Box enterprise user.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an enterprise user; this cannot be undone. Fails while the user owns content unless Force is "true", so run Transfer Owned Folders first to keep their files. Needs admin rights; get the ID from List Users.',
    idempotent: false,
  },
  props: {
    userId: boxAiProps.userId({ required: true, description: 'Box user ID to delete. Get it from List Users.' }),
    notify: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Notify',
      description: '"true" to email the user about the deletion.',
    }),
    force: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Force',
      description: '"true" to delete the user and their files even if they still own content. Retention policies and legal holds still block it with 403.',
    }),
  },
  async run({ auth, propsValue }) {
    for (const value of [propsValue.notify, propsValue.force]) {
      if (value !== undefined && !BOOLEANS.includes(value)) {
        throw new Error('Notify and Force must be "true" or "false".');
      }
    }
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(propsValue.userId)}`,
      query: { notify: propsValue.notify, force: propsValue.force },
    });
    return { deleted: true, userId: propsValue.userId };
  },
});
