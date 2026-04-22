import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const requestTicketApproval = createAction({
  auth: freshserviceAuth,
  name: 'request_ticket_approval',
  displayName: 'Request Ticket Approval',
  description: 'Requests approval for a ticket from a specified agent.',
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
        ],
      },
    }),
  },
  async run(context) {
    const response = await freshserviceApiCall<{ approval: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: `tickets/${context.propsValue.ticket_id}/approvals`,
      auth: context.auth,
      body: {
        approver_ids: [context.propsValue.approver_id],
        approval_type: context.propsValue.approval_type ?? 2,
      },
    });

    return response.body.approval;
  },
});
