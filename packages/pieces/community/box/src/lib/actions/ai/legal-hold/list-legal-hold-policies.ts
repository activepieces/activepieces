import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listLegalHoldPoliciesAction = createAction({
  auth: boxAuth,
  name: 'box_list_legal_hold_policies',
  displayName: 'List Legal Hold Policies',
  description: 'Lists the legal hold policies of the Box enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the enterprise\'s legal hold policies with their IDs and status, optionally filtered by name prefix. Needs admin rights and Box Governance. Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    policyName: Property.ShortText({
      displayName: 'Policy Name',
      description: 'Case-insensitive prefix of the policy name to filter by.',
      required: false,
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/legal_hold_policies',
      query: {
        policy_name: propsValue.policyName,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        fields: propsValue.fields,
      },
    });
  },
});
