import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const RESOLVED_FOR_TYPES = ['user', 'enterprise'];

export const listStoragePolicyAssignmentsAction = createAction({
  auth: boxAuth,
  name: 'box_list_storage_policy_assignments',
  displayName: 'List Storage Policy Assignments',
  description: 'Lists the storage policy assignments that apply to a Box user or the enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the storage policy assignments in effect for one user or the enterprise, with their assignment IDs. Get a user ID from List Users, or the enterprise ID from Get Current User (enterprise.id). Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    resolvedForType: Property.StaticDropdown({
      displayName: 'Resolved For Type',
      description: '"user" or "enterprise".',
      required: true,
      options: { options: RESOLVED_FOR_TYPES.map((value) => ({ label: value, value })) },
    }),
    resolvedForId: Property.ShortText({
      displayName: 'Resolved For ID',
      description: 'ID of the user or enterprise.',
      required: true,
    }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (!RESOLVED_FOR_TYPES.includes(propsValue.resolvedForType)) {
      throw new Error(`Resolved For Type must be one of: ${RESOLVED_FOR_TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/storage_policy_assignments',
      query: {
        resolved_for_type: propsValue.resolvedForType,
        resolved_for_id: propsValue.resolvedForId,
        marker: propsValue.marker,
      },
    });
  },
});
