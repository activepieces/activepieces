import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteRetentionPolicyAssignmentAction = createAction({
  auth: boxAuth,
  name: 'box_delete_retention_policy_assignment',
  displayName: 'Delete Retention Policy Assignment',
  description: 'Removes a Box retention policy from the content it was assigned to.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes a retention policy assignment so the policy no longer applies to that folder, enterprise or metadata template; cannot be undone, re-apply with Assign Retention Policy. Non-modifiable policies refuse it. Get the ID from List Retention Policy Assignments.',
    idempotent: false,
  },
  props: {
    retentionPolicyAssignmentId: boxAiProps.retentionPolicyAssignmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/retention_policy_assignments/${encodeURIComponent(propsValue.retentionPolicyAssignmentId)}`,
    });
    return { deleted: true, retentionPolicyAssignmentId: propsValue.retentionPolicyAssignmentId };
  },
});
