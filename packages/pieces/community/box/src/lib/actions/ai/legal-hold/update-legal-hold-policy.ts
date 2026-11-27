import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateLegalHoldPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_update_legal_hold_policy',
  displayName: 'Update Legal Hold Policy',
  description: 'Changes the name, description or release notes of a Box legal hold policy.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a legal hold policy\'s name, description or release notes; only the fields given change. To release a hold use Delete Legal Hold Policy or Unassign Legal Hold Policy. Get the ID from List Legal Hold Policies.',
    idempotent: true,
  },
  props: {
    legalHoldPolicyId: boxAiProps.legalHoldPolicyId({ required: true }),
    policyName: Property.ShortText({ displayName: 'Policy Name', description: 'New name.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New description.', required: false }),
    releaseNotes: Property.LongText({ displayName: 'Release Notes', description: 'Why the policy was released.', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = {
      ...(propsValue.policyName !== undefined ? { policy_name: propsValue.policyName } : {}),
      ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      ...(propsValue.releaseNotes !== undefined ? { release_notes: propsValue.releaseNotes } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/legal_hold_policies/${encodeURIComponent(propsValue.legalHoldPolicyId)}`,
      body,
    });
  },
});
