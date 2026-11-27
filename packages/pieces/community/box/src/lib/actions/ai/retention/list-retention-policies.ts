import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

const POLICY_TYPES = ['finite', 'indefinite'];

export const listRetentionPoliciesAction = createAction({
  auth: boxAuth,
  name: 'box_list_retention_policies',
  displayName: 'List Retention Policies',
  description: 'Lists the retention policies of the Box enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the enterprise\'s retention policies with their IDs, optionally filtered by name prefix, type or creator. Needs admin rights and Box Governance. Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    policyName: Property.ShortText({
      displayName: 'Policy Name',
      description: 'Case-sensitive prefix of the policy name to filter by.',
      required: false,
    }),
    policyType: Property.StaticDropdown({
      displayName: 'Policy Type',
      description: '"finite" or "indefinite".',
      required: false,
      options: { options: POLICY_TYPES.map((value) => ({ label: value, value })) },
    }),
    createdByUserId: boxAiProps.userId({
      required: false,
      displayName: 'Created By User ID',
      description: 'Only policies created by this user. Get user IDs from List Users.',
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.policyType !== undefined && !POLICY_TYPES.includes(propsValue.policyType)) {
      throw new Error(`Policy Type must be one of: ${POLICY_TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/retention_policies',
      query: {
        policy_name: propsValue.policyName,
        policy_type: propsValue.policyType,
        created_by_user_id: propsValue.createdByUserId,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        fields: propsValue.fields,
      },
    });
  },
});
