import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

const ASSIGN_TO_TYPES = ['file', 'file_version', 'folder', 'user', 'ownership', 'interactions', 'metadata_template'];

export const listLegalHoldPolicyAssignmentsAction = createAction({
  auth: boxAuth,
  name: 'box_list_legal_hold_policy_assignments',
  displayName: 'List Legal Hold Policy Assignments',
  description: 'Lists the items a Box legal hold policy is assigned to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of a legal hold policy\'s assignments with their assignment IDs, optionally only those on one item type or item. Needs admin rights and Box Governance. Page with Marker (next_marker). Get the policy ID from List Legal Hold Policies.',
    idempotent: true,
  },
  props: {
    policyId: boxAiProps.legalHoldPolicyId({ required: true }),
    assignToType: Property.StaticDropdown({
      displayName: 'Assign To Type',
      description: 'Only assignments to this item type: file, file_version, folder, user, ownership, interactions or metadata_template.',
      required: false,
      options: { options: ASSIGN_TO_TYPES.map((value) => ({ label: value, value })) },
    }),
    assignToId: Property.ShortText({
      displayName: 'Assign To ID',
      description: 'Only assignments to the item with this ID.',
      required: false,
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.assignToType !== undefined && !ASSIGN_TO_TYPES.includes(propsValue.assignToType)) {
      throw new Error(`Assign To Type must be one of: ${ASSIGN_TO_TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/legal_hold_policy_assignments',
      query: {
        policy_id: propsValue.policyId,
        assign_to_type: propsValue.assignToType,
        assign_to_id: propsValue.assignToId,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        fields: propsValue.fields,
      },
    });
  },
});
