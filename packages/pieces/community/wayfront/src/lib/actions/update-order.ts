import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { wayfrontAuth } from '../auth';
import {
  flattenOrder,
  ordersDropdown,
  wayfrontApiClient,
  WayfrontAuthType,
  WayfrontIndexOrder,
} from '../common';

export const updateOrderAction = createAction({
  auth: wayfrontAuth,
  name: 'update_order',
  displayName: 'Update Order',
  description: 'Updates an order in Wayfront. Only the fields you provide will be changed.',
  props: {
    order_ref: ordersDropdown,
    note: Property.LongText({
      displayName: 'Note',
      description: 'Updated internal note for the order.',
      required: false,
    }),
    status: Property.Number({
      displayName: 'Status ID',
      description: 'Numeric ID of the order status. Find status IDs in your Wayfront workspace settings.',
      required: false,
    }),
    service_id: Property.Number({
      displayName: 'Service ID',
      description: 'ID of the service to attach to this order.',
      required: false,
    }),
    date_due: Property.ShortText({
      displayName: 'Due Date',
      description: 'Updated due date. Format: 2021-09-01T00:00:00+00:00 (ISO 8601).',
      required: false,
    }),
    date_started: Property.ShortText({
      displayName: 'Start Date',
      description: 'Updated start date. Format: 2021-09-01T00:00:00+00:00 (ISO 8601).',
      required: false,
    }),
    date_completed: Property.ShortText({
      displayName: 'Completion Date',
      description: 'Updated completion date. Format: 2021-09-01T00:00:00+00:00 (ISO 8601).',
      required: false,
    }),
    created_at: Property.ShortText({
      displayName: 'Created Date',
      description: 'Override the creation date. Format: 2021-09-01T00:00:00+00:00 (ISO 8601).',
      required: false,
    }),
    employees: Property.ShortText({
      displayName: 'Assigned Employee IDs',
      description: 'Comma-separated IDs of employees to assign to this order (e.g. 1,2,3).',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags (e.g. vip,rush). Replaces all existing tags.',
      required: false,
    }),
    linked_orders: Property.ShortText({
      displayName: 'Linked Order Numbers',
      description: 'Comma-separated order numbers to link (e.g. B1C2D3,E4F5G6). Replaces existing links.',
      required: false,
    }),
    form_data: Property.ShortText({
      displayName: 'Form Data',
      description: 'Comma-separated form data values to attach to the order.',
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

    const formData = p.form_data
      ? p.form_data.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const metadata = p.metadata
      ? p.metadata.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const body = {
      ...(!isNil(p.note) && { note: p.note }),
      ...(!isNil(p.status) && { status: p.status }),
      ...(!isNil(p.service_id) && { service_id: p.service_id }),
      ...(!isNil(p.date_due) && { date_due: p.date_due }),
      ...(!isNil(p.date_started) && { date_started: p.date_started }),
      ...(!isNil(p.date_completed) && { date_completed: p.date_completed }),
      ...(!isNil(p.created_at) && { created_at: p.created_at }),
      ...(employeeIds !== undefined && { 'employees[]': employeeIds }),
      ...(tags !== undefined && { 'tags[]': tags }),
      ...(linkedOrders !== undefined && { 'linked_orders[]': linkedOrders }),
      ...(formData !== undefined && { 'form_data[]': formData }),
      ...(metadata !== undefined && { 'metadata[]': metadata }),
    };

    const response = await wayfrontApiClient(auth.workspaceUrl, auth.apiToken).put<WayfrontIndexOrder>(
      `/orders/${p.order_ref}`,
      body,
    );

    return flattenOrder(response.body);
  },
});
