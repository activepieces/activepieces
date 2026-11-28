import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteGroupOutputSchema } from '../../../output-schemas';

export const deleteGroupAction = createAction({
  auth: boxAuth,
  name: 'box_delete_group',
  outputSchema: boxDeleteGroupOutputSchema,
  displayName: 'Delete Group',
  description: 'Permanently deletes a Box group.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a group and its memberships; the users themselves stay. Needs admin rights. Get the ID from List Groups.',
    idempotent: false,
  },
  props: {
    groupId: boxAiProps.groupId({ required: true, description: 'Box group ID to delete. Get it from List Groups.' }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/groups/${encodeURIComponent(propsValue.groupId)}`,
    });
    return { deleted: true, groupId: propsValue.groupId };
  },
});
