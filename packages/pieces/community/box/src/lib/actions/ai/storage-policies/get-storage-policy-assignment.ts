import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getStoragePolicyAssignmentAction = createAction({
  auth: boxAuth,
  name: 'box_get_storage_policy_assignment',
  displayName: 'Get Storage Policy Assignment',
  description: 'Gets a Box storage policy assignment.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one storage policy assignment by ID: its storage policy and the user or enterprise it applies to. Get the ID from List Storage Policy Assignments or Assign Storage Policy.',
    idempotent: true,
  },
  props: {
    storagePolicyAssignmentId: boxAiProps.storagePolicyAssignmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/storage_policy_assignments/${encodeURIComponent(propsValue.storagePolicyAssignmentId)}`,
    });
  },
});
