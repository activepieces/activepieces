import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import { pendingApprovalDropdown } from '../common/props';
import { flattenRecord } from '../common/utils';

export const grantApproval = createAction({
  auth: coupaAuth,
  name: 'grant_approval',
  displayName: 'Grant Approval',
  description:
    'Approves a pending approval in Coupa (e.g. a requisition or purchase order awaiting your decision). Pick the approval from the dropdown.',
  props: {
    approvalId: pendingApprovalDropdown,
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const result = await client.request<Record<string, unknown>>({
      method: HttpMethod.PUT,
      resourceUri: `/approvals/${propsValue.approvalId}/approve`,
    });
    return flattenRecord(result);
  },
});
