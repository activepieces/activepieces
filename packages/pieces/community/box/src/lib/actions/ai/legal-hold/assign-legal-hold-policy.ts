import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const ASSIGN_TO_TYPES = ['file', 'file_version', 'folder', 'user', 'ownership', 'interactions', 'metadata_template'];

export const assignLegalHoldPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_assign_legal_hold_policy',
  displayName: 'Assign Legal Hold Policy',
  description: 'Places a Box legal hold on a file, file version, folder, user or metadata template.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies a legal hold policy to an item and returns the assignment ID; held content cannot be deleted. "user", "ownership" and "interactions" take a user ID (from List Users), file_version an ID from List File Versions. Get the policy ID from List Legal Hold Policies; release with Unassign Legal Hold Policy.',
    idempotent: false,
  },
  props: {
    policyId: boxAiProps.legalHoldPolicyId({ required: true }),
    assignToType: Property.StaticDropdown({
      displayName: 'Assign To Type',
      description: 'file, file_version, folder, user, ownership, interactions or metadata_template.',
      required: true,
      options: { options: ASSIGN_TO_TYPES.map((value) => ({ label: value, value })) },
    }),
    assignToId: Property.ShortText({
      displayName: 'Assign To ID',
      description: 'ID of the file, file version, folder, user or metadata template to hold.',
      required: true,
    }),
    filterFields: Property.Array({
      displayName: 'Filter Fields',
      description: 'For "metadata_template" only: {field, value} pairs; only files whose metadata matches are held.',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field', description: 'Metadata template field ID.', required: true }),
        value: Property.ShortText({ displayName: 'Value', description: 'Value of the field to match.', required: true }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    if (!ASSIGN_TO_TYPES.includes(propsValue.assignToType)) {
      throw new Error(`Assign To Type must be one of: ${ASSIGN_TO_TYPES.join(', ')}.`);
    }
    const filterFields = propsValue.filterFields?.length ? propsValue.filterFields : undefined;
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/legal_hold_policy_assignments',
      body: {
        policy_id: propsValue.policyId,
        assign_to: { type: propsValue.assignToType, id: propsValue.assignToId },
        ...(filterFields !== undefined ? { filter_fields: filterFields } : {}),
      },
    });
  },
});
