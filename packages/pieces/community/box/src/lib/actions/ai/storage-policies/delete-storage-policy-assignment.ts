import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteStoragePolicyAssignmentAction = createAction({
  auth: boxAuth,
  name: 'box_delete_storage_policy_assignment',
  displayName: 'Delete Storage Policy Assignment',
  description: 'Removes a Box storage policy assignment.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a storage policy assignment; a user then falls back to the enterprise default storage policy. Box allows this only twice per user per 24 hours. Get the ID from List Storage Policy Assignments.',
    idempotent: false,
  },
  props: {
    storagePolicyAssignmentId: boxAiProps.storagePolicyAssignmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/storage_policy_assignments/${encodeURIComponent(propsValue.storagePolicyAssignmentId)}`,
    });
    return { deleted: true, storagePolicyAssignmentId: propsValue.storagePolicyAssignmentId };
  },
});
