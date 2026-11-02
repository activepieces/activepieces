import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { compactBody, freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';
import { freshserviceSchemas } from '../common/schemas';

export const requestTicketApproval = createAction({
  auth: freshserviceAuth,
  name: 'request_ticket_approval',
  classification: 'WRITE',
  displayName: 'Request Ticket Approval',
  description: 'Requests approval on a Service Request ticket from a specified agent. Freshservice only supports approvals on Service Requests.',
  audience: 'human',
  outputSchema: freshserviceSchemas.approval,
  aiMetadata: {
    description: 'Sends an approval request on a Freshservice Service Request ticket (approvals are not supported on incidents) to a designated approver agent. Use when a ticket needs sign-off before proceeding; requires the numeric ticket id and the approver agent id (find agents with List Agents), and optionally sets whether all approvers or any one must approve. Not idempotent — each call raises a new approval request.',
    idempotent: false,
  },
  props: {
    ticket_id: freshserviceCommon.ticket(true),
    approver_id: freshserviceCommon.agent(true),
    approval_type: Property.StaticDropdown({
      displayName: 'Approval Type',
      description: 'How approval is determined when there are multiple approvers.',
      required: false,
      defaultValue: 2,
      options: {
        options: [
          { label: 'All must approve', value: 1 },
          { label: 'Any one can approve', value: 2 },
          { label: 'Majority must approve', value: 3 },
          { label: 'First responder decides', value: 4 },
        ],
      },
    }),
    email_content: Property.LongText({
      displayName: 'Email Content',
      description: 'Optional HTML message sent to the approver.',
      required: false,
    }),
  },
  async run(context) {
    const response = await freshserviceApiCall<{ approval: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: `tickets/${context.propsValue.ticket_id}/approvals`,
      auth: context.auth,
      body: compactBody({
        approver_id: context.propsValue.approver_id,
        approval_type: context.propsValue.approval_type ?? 2,
        email_content: context.propsValue.email_content,
      }),
    });

    return response.body.approval;
  },
});
