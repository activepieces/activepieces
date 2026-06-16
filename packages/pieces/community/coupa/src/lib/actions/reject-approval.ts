import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import { pendingApprovalDropdown } from '../common/props';
import { flattenRecord } from '../common/utils';

export const rejectApproval = createAction({
  auth: coupaAuth,
  name: 'reject_approval',
  displayName: 'Reject Approval',
  description:
    'Rejects a pending approval in Coupa (e.g. a requisition or purchase order awaiting your decision). Pick the approval from the dropdown.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reject a pending Coupa approval (e.g. a requisition or purchase order awaiting decision) by its approval ID, optionally recording a rejection reason. Use Grant Approval to approve instead. Not idempotent: the approval must be in a pending state, and re-running after it is decided may fail.',
    idempotent: false,
  },
  props: {
    approvalId: pendingApprovalDropdown,
    reason: Property.LongText({
      displayName: 'Rejection Reason',
      description: 'Optional note explaining why the approval was rejected.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    // Coupa expects the rejection reason as a URL query parameter, not in the
    // request body: PUT /api/approvals/{id}/reject?reason=... (the client
    // URL-encodes it). See Coupa Core API "Approvals" docs.
    const query: Record<string, string | undefined> = {};
    if (propsValue.reason) {
      query['reason'] = propsValue.reason;
    }
    const result = await client.request<Record<string, unknown>>({
      method: HttpMethod.PUT,
      resourceUri: `/approvals/${propsValue.approvalId}/reject`,
      query,
    });
    return flattenRecord(result);
  },
});
