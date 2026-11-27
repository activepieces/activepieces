import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

const TYPES = ['folder', 'enterprise', 'metadata_template'];

export const listRetentionPolicyAssignmentsAction = createAction({
  auth: boxAuth,
  name: 'box_list_retention_policy_assignments',
  displayName: 'List Retention Policy Assignments',
  description: 'Lists where a Box retention policy is assigned.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of a retention policy\'s assignments (folders, the enterprise or metadata templates) with their assignment IDs. Needs admin rights and Box Governance. Page with Marker (next_marker). Get the policy ID from List Retention Policies.',
    idempotent: true,
  },
  props: {
    retentionPolicyId: boxAiProps.retentionPolicyId({ required: true }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Only assignments to "folder", "enterprise" or "metadata_template".',
      required: false,
      options: { options: TYPES.map((value) => ({ label: value, value })) },
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.type !== undefined && !TYPES.includes(propsValue.type)) {
      throw new Error(`Type must be one of: ${TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/retention_policies/${encodeURIComponent(propsValue.retentionPolicyId)}/assignments`,
      query: {
        type: propsValue.type,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        fields: propsValue.fields,
      },
    });
  },
});
