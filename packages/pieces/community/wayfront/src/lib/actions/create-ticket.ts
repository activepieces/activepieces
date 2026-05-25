import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { wayfrontAuth } from '../auth';
import {
  clientsDropdown,
  flattenTicket,
  wayfrontApiClient,
  WayfrontAuthType,
  WayfrontTicket,
} from '../common';

export const createTicketAction = createAction({
  auth: wayfrontAuth,
  name: 'create_ticket',
  displayName: 'Create Ticket',
  description: 'Creates a new support ticket for a client in Wayfront.',
  props: {
    user_id: clientsDropdown,
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the ticket.',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'An internal note to attach to the ticket.',
      required: false,
    }),
    status: Property.Number({
      displayName: 'Status ID',
      description: 'Numeric ID of the ticket status. Find status IDs in your Wayfront workspace settings.',
      required: false,
    }),
    employees: Property.ShortText({
      displayName: 'Assigned Employee IDs',
      description: 'Comma-separated IDs of employees to assign to this ticket (e.g. 1,2,3).',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags to apply to the ticket (e.g. billing,urgent).',
      required: false,
    }),
    order: Property.ShortText({
      displayName: 'Order Reference',
      description: 'The order number or reference to link to this ticket.',
      required: false,
    }),
    metadata: Property.ShortText({
      displayName: 'Metadata',
      description: 'Comma-separated metadata values to attach to the ticket.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as WayfrontAuthType;
    const p = context.propsValue;

    const employeeIds = p.employees
      ? p.employees
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      : undefined;

    const tags = p.tags
      ? p.tags.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const metadata = p.metadata
      ? p.metadata.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const body = {
      user_id: p.user_id,
      subject: p.subject,
      ...(!isNil(p.note) && { note: p.note }),
      ...(!isNil(p.status) && { status: p.status }),
      ...(employeeIds !== undefined && { 'employees[]': employeeIds }),
      ...(tags !== undefined && { 'tags[]': tags }),
      ...(!isNil(p.order) && { order: p.order }),
      ...(metadata !== undefined && { 'metadata[]': metadata }),
    };

    const response = await wayfrontApiClient(auth.workspaceUrl, auth.apiToken).post<WayfrontTicket>(
      '/tickets',
      body,
    );

    return flattenTicket(response.body);
  },
});
