import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getLegalHoldPolicyAssignmentAction = createAction({
  auth: boxAuth,
  name: 'box_get_legal_hold_policy_assignment',
  displayName: 'Get Legal Hold Policy Assignment',
  description: 'Gets the details of a Box legal hold policy assignment.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one legal hold policy assignment by ID: its policy, the held item, filters and who assigned it when. Get the ID from List Legal Hold Policy Assignments or Assign Legal Hold Policy.',
    idempotent: true,
  },
  props: {
    legalHoldPolicyAssignmentId: boxAiProps.legalHoldPolicyAssignmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/legal_hold_policy_assignments/${encodeURIComponent(propsValue.legalHoldPolicyAssignmentId)}`,
    });
  },
});
