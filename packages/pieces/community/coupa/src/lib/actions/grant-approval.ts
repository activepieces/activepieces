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
  audience: 'both',
  aiMetadata: {
    description:
      'Approve a pending Coupa approval (e.g. a requisition or purchase order awaiting decision) by its approval ID, advancing the document through its approval chain. Use Reject Approval to decline instead. Not idempotent: the approval must be in a pending state, and re-running after it is decided may fail.',
    idempotent: false,
  },
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
