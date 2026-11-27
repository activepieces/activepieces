import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getRetentionPolicyAssignmentAction = createAction({
  auth: boxAuth,
  name: 'box_get_retention_policy_assignment',
  displayName: 'Get Retention Policy Assignment',
  description: 'Gets the details of a Box retention policy assignment.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one retention policy assignment by ID: its policy, what it is assigned to, filters and who assigned it when. Get the ID from List Retention Policy Assignments or Assign Retention Policy.',
    idempotent: true,
  },
  props: {
    retentionPolicyAssignmentId: boxAiProps.retentionPolicyAssignmentId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/retention_policy_assignments/${encodeURIComponent(propsValue.retentionPolicyAssignmentId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
