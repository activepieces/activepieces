import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { compactBody, freshserviceApiCall } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiRequestTicketApproval = createAction({
  auth: freshserviceAuth,
  name: 'ai_request_ticket_approval',
  displayName: 'Request Ticket Approval (AI)',
  description: 'Requests approval on a Freshservice Service Request from an agent.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.approval,
  aiMetadata: {
    description:
      'Sends an approval request on a Freshservice Service Request ticket (numeric ticket id; approvals fail on incidents) to one approver agent (numeric agent id from List Agents). approval_type: "any" (default) one approval is enough, "all" everyone must approve, "majority" most must approve, "first_responder" the first response decides. Optional email_content is HTML sent to the approver. Not idempotent — each call raises a new approval request.',
    idempotent: false,
  },
  props: {
    ticket_id: Property.Number({ displayName: 'Ticket ID', required: true }),
    approver_id: Property.Number({ displayName: 'Approver Agent ID', required: true }),
    approval_type: Property.StaticDropdown<string, false>({
      displayName: 'Approval Type',
      required: false,
      options: {
        options: [
          { label: 'Any one can approve', value: 'any' },
          { label: 'All must approve', value: 'all' },
          { label: 'Majority must approve', value: 'majority' },
          { label: 'First responder decides', value: 'first_responder' },
        ],
      },
    }),
    email_content: Property.LongText({ displayName: 'Email Content', description: 'Optional HTML message to the approver.', required: false }),
  },
  async run(context) {
    const { ticket_id, approver_id, approval_type, email_content } = context.propsValue;
    const response = await freshserviceApiCall<{ approval: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: `tickets/${ticket_id}/approvals`,
      auth: context.auth,
      body: compactBody({ approver_id, approval_type: APPROVAL_TYPES[approval_type ?? 'any'] ?? 2, email_content }),
    });
    return response.body.approval;
  },
});

const APPROVAL_TYPES: Record<string, number> = { all: 1, any: 2, majority: 3, first_responder: 4 };
