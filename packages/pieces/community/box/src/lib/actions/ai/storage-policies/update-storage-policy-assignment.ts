import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateStoragePolicyAssignmentAction = createAction({
  auth: boxAuth,
  name: 'box_update_storage_policy_assignment',
  displayName: 'Update Storage Policy Assignment',
  description: 'Switches a Box storage policy assignment to another storage policy.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Points an existing storage policy assignment at a different storage policy (data region). Get the assignment ID from List Storage Policy Assignments and the policy ID from List Storage Policies.',
    idempotent: true,
  },
  props: {
    storagePolicyAssignmentId: boxAiProps.storagePolicyAssignmentId({ required: true }),
    storagePolicyId: boxAiProps.storagePolicyId({
      required: true,
      description: 'The new storage policy. Get it from List Storage Policies.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/storage_policy_assignments/${encodeURIComponent(propsValue.storagePolicyAssignmentId)}`,
      body: { storage_policy: { type: 'storage_policy', id: propsValue.storagePolicyId } },
    });
  },
});
