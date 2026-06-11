import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { wayfrontAuth } from '../auth';
import {
  clientsDropdown,
  flattenOrder,
  wayfrontApiClient,
  WayfrontAuthType,
  WayfrontIndexOrder,
} from '../common';

export const createOrderAction = createAction({
  auth: wayfrontAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Creates a new order for a client in Wayfront.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new order for a specific Wayfront client. Identify the service either by a free-text service title or by an existing service ID (supply one of the two); optionally set status, order number, due/start/completion/created dates, assigned employees, tags, linked orders, and metadata. Requires the client user ID. Not idempotent: each call creates a separate order.',
    idempotent: false,
  },
  props: {
    user_id: clientsDropdown,
    service: Property.ShortText({
      displayName: 'Service / Order Title',
      description:
        'The name of the service or title for this order (e.g. "Instagram Followers"). Required if no Service ID is provided.',
      required: false,
    }),
    service_id: Property.Number({
      displayName: 'Service ID',
      description:
        'ID of an existing service in Wayfront to attach to this order. Required if no Service / Order Title is provided.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'An internal note to attach to the order.',
      required: false,
    }),
    status: Property.Number({
      displayName: 'Status ID',
      description: 'Numeric ID of the order status. Find status IDs in your Wayfront workspace settings.',
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Order Number',
      description: 'Custom order reference number (e.g. B1C2D3E4F5). Leave empty to auto-generate.',
      required: false,
    }),
    date_due: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date for the order. Format: 2021-09-01T00:00:00+00:00 (ISO 8601).',
      required: false,
    }),
    date_started: Property.ShortText({
      displayName: 'Start Date',
      description: 'Date the order was started. Format: 2021-09-01T00:00:00+00:00 (ISO 8601).',
      required: false,
    }),
    date_completed: Property.ShortText({
      displayName: 'Completion Date',
      description: 'Date the order was completed. Format: 2021-09-01T00:00:00+00:00 (ISO 8601).',
      required: false,
    }),
    created_at: Property.ShortText({
      displayName: 'Created Date',
      description: 'Override the creation date. Format: 2021-09-01T00:00:00+00:00. Leave empty to use now.',
      required: false,
    }),
    employees: Property.ShortText({
      displayName: 'Assigned Employee IDs',
      description: 'Comma-separated IDs of employees to assign to this order (e.g. 1,2,3).',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags to apply to the order (e.g. vip,rush).',
      required: false,
    }),
    linked_orders: Property.ShortText({
      displayName: 'Linked Order Numbers',
      description: 'Comma-separated order numbers to link to this order (e.g. B1C2D3,E4F5G6).',
      required: false,
    }),
    metadata: Property.ShortText({
      displayName: 'Metadata',
      description: 'Comma-separated metadata values to attach to the order.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as WayfrontAuthType;
    const p = context.propsValue;

    const employeeIds = p.employees
      ? p.employees.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
      : undefined;

    const tags = p.tags
      ? p.tags.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const linkedOrders = p.linked_orders
      ? p.linked_orders.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const metadata = p.metadata
      ? p.metadata.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const body = {
      user_id: p.user_id,
      ...(!isNil(p.service) && { service: p.service }),
      ...(!isNil(p.service_id) && { service_id: p.service_id }),
      ...(!isNil(p.note) && { note: p.note }),
      ...(!isNil(p.status) && { status: p.status }),
      ...(!isNil(p.number) && { number: p.number }),
      ...(!isNil(p.date_due) && { date_due: p.date_due }),
      ...(!isNil(p.date_started) && { date_started: p.date_started }),
      ...(!isNil(p.date_completed) && { date_completed: p.date_completed }),
      ...(!isNil(p.created_at) && { created_at: p.created_at }),
      ...(employeeIds !== undefined && { 'employees[]': employeeIds }),
      ...(tags !== undefined && { 'tags[]': tags }),
      ...(linkedOrders !== undefined && { 'linked_orders[]': linkedOrders }),
      ...(metadata !== undefined && { 'metadata[]': metadata }),
    };

    const response = await wayfrontApiClient(auth.workspaceUrl, auth.apiToken).post<WayfrontIndexOrder>(
      '/orders',
      body,
    );

    return flattenOrder(response.body);
  },
});
