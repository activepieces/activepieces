import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteLegalHoldPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_delete_legal_hold_policy',
  displayName: 'Delete Legal Hold Policy',
  description: 'Deletes a Box legal hold policy and releases its holds.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a legal hold policy, releasing every hold it placed; cannot be undone. Box finishes it in the background, so Get Legal Hold Policy may show "releasing" for a while. Get the ID from List Legal Hold Policies.',
    idempotent: false,
  },
  props: {
    legalHoldPolicyId: boxAiProps.legalHoldPolicyId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/legal_hold_policies/${encodeURIComponent(propsValue.legalHoldPolicyId)}`,
    });
    return { deleted: true, legalHoldPolicyId: propsValue.legalHoldPolicyId };
  },
});
