import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const unassignLegalHoldPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_unassign_legal_hold_policy',
  displayName: 'Unassign Legal Hold Policy',
  description: 'Releases a Box legal hold from the item it was placed on.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes a legal hold policy assignment, releasing the hold on that item; the policy itself stays. Box finishes it in the background. Re-apply with Assign Legal Hold Policy. Get the ID from List Legal Hold Policy Assignments.',
    idempotent: false,
  },
  props: {
    legalHoldPolicyAssignmentId: boxAiProps.legalHoldPolicyAssignmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/legal_hold_policy_assignments/${encodeURIComponent(propsValue.legalHoldPolicyAssignmentId)}`,
    });
    return { unassigned: true, legalHoldPolicyAssignmentId: propsValue.legalHoldPolicyAssignmentId };
  },
});
