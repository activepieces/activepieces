import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const ASSIGNED_TO_TYPES = ['user', 'enterprise'];

export const assignStoragePolicyAction = createAction({
  auth: boxAuth,
  name: 'box_assign_storage_policy',
  displayName: 'Assign Storage Policy',
  description: 'Assigns a Box storage policy to a user or the enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Assigns a storage policy (data region) to a user or the enterprise and returns the assignment ID; to change an existing one use Update Storage Policy Assignment. Get the policy ID from List Storage Policies, a user ID from List Users, the enterprise ID from Get Current User.',
    idempotent: false,
  },
  props: {
    storagePolicyId: boxAiProps.storagePolicyId({ required: true }),
    assignedToType: Property.StaticDropdown({
      displayName: 'Assigned To Type',
      description: '"user" or "enterprise".',
      required: true,
      options: { options: ASSIGNED_TO_TYPES.map((value) => ({ label: value, value })) },
    }),
    assignedToId: Property.ShortText({
      displayName: 'Assigned To ID',
      description: 'ID of the user or enterprise.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    if (!ASSIGNED_TO_TYPES.includes(propsValue.assignedToType)) {
      throw new Error(`Assigned To Type must be one of: ${ASSIGNED_TO_TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/storage_policy_assignments',
      body: {
        storage_policy: { type: 'storage_policy', id: propsValue.storagePolicyId },
        assigned_to: { type: propsValue.assignedToType, id: propsValue.assignedToId },
      },
    });
  },
});
