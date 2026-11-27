import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getLegalHoldPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_get_legal_hold_policy',
  displayName: 'Get Legal Hold Policy',
  description: 'Gets the details of a Box legal hold policy.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one legal hold policy by ID: name, status (active, applying, releasing, released), filter dates and assignment counts. Get the ID from List Legal Hold Policies or Create Legal Hold Policy.',
    idempotent: true,
  },
  props: {
    legalHoldPolicyId: boxAiProps.legalHoldPolicyId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/legal_hold_policies/${encodeURIComponent(propsValue.legalHoldPolicyId)}`,
    });
  },
});
