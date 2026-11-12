import { genayaApi } from './client';
import {
  GenayaAddress,
  GenayaAppointment,
  GenayaClient,
  GenayaInvoice,
  GenayaLineItem,
  GenayaTask,
  GenayaWebhookEvent,
} from './types';

// Action outputs are flat records (one value per column) so they drop straight
// into a spreadsheet or table. Lists are joined with ", ".

function clientOutput(client: GenayaClient): Record<string, unknown> {
  return {
    id: client.id,
    client_number: client.numericId ?? null,
    client_code: client.uuid ?? null,
    title: client.title ?? null,
    first_name: client.firstName ?? null,
    last_name: client.lastName ?? null,
    full_name: client.fullName ?? null,
    company: client.company ?? null,
    email: client.email ?? null,
    phone: client.phone ?? null,
    secondary_phone: client.secondaryPhone ?? null,
    phone_numbers: joinList((client.phoneNumbers ?? []).map((entry) => entry.number)),
    ...addressOutput(client.address),
    full_address: client.fullAddress ?? null,
    lead_source: client.leadSource ?? null,
    status: client.status ?? null,
    company_id: client.organizationCompanyId ?? null,
    company_name: client.organizationCompanyName ?? null,
    created_at: client.createdAt ?? null,
    updated_at: client.updatedAt ?? null,
    ...customFieldsOutput(client.customFields),
  };
}

function appointmentOutput(appointment: GenayaAppointment): Record<string, unknown> {
  const team = appointment.team ?? [];
  return {
    id: appointment.id,
    appointment_number: appointment.appointmentId ?? null,
    appointment_code: appointment.uuid ?? null,
    status: appointment.status ?? null,
    sub_status: appointment.subStatus ?? null,
    appointment_type: appointment.appointmentType ?? null,
    description: appointment.description ?? null,
    start_at: appointment.startAt ?? null,
    end_at: appointment.endAt ?? null,
    start_at_local: appointment.startAtLocal ?? null,
    end_at_local: appointment.endAtLocal ?? null,
    timezone: appointment.timezone ?? null,
    client_id: appointment.clientId ?? null,
    client_name: appointment.clientFullName ?? null,
    client_first_name: appointment.firstName ?? null,
    client_last_name: appointment.lastName ?? null,
    client_company: appointment.company ?? null,
    client_email: appointment.email ?? null,
    client_phone: appointment.phone ?? null,
    client_secondary_phone: appointment.secondaryPhone ?? null,
    ...addressOutput(appointment.address),
    full_address: appointment.fullAddress ?? null,
    service_area: appointment.serviceArea ?? null,
    lead_source: appointment.leadSource ?? null,
    vendor: appointment.vendor ?? null,
    assigned_team_ids: joinList(team.map((member) => member.id)),
    assigned_team_names: joinList(team.map((member) => member.name)),
    tags: joinList(appointment.tags ?? []),
    line_items_count: (appointment.lineItems ?? []).length,
    line_items_summary: lineItemsSummary(appointment.lineItems),
    subtotal: appointment.subtotal ?? null,
    tax_total: appointment.taxTotal ?? null,
    total: appointment.total ?? null,
    balance: appointment.balance ?? null,
    currency: appointment.currency ?? null,
    company_id: appointment.companyId ?? null,
    company_name: appointment.companyName ?? null,
    created_by_name: appointment.createdByName ?? null,
    created_at: appointment.createdAt ?? null,
    updated_at: appointment.updatedAt ?? null,
    ...customFieldsOutput(appointment.customFields),
  };
}

function invoiceOutput(invoice: GenayaInvoice): Record<string, unknown> {
  return {
    id: invoice.id,
    invoice_number: invoice.number ?? null,
    invoice_code: invoice.uuid ?? null,
    name: invoice.invoiceName ?? null,
    status: invoice.status ?? null,
    sent: invoice.sent ?? false,
    sent_at: invoice.sentAt ?? null,
    currency: invoice.currency ?? null,
    issue_date: invoice.issueDate ?? null,
    due_date: invoice.dueDate ?? null,
    terms: invoice.terms ?? null,
    subtotal: invoice.subtotal ?? null,
    discount_name: invoice.discountName ?? null,
    discount_total: invoice.discountTotal ?? null,
    tax_total: invoice.taxTotal ?? null,
    tip_total: invoice.tipTotal ?? null,
    total: invoice.total ?? null,
    amount_paid: invoice.amountPaid ?? null,
    balance: invoice.balance ?? null,
    notes: invoice.notes ?? null,
    client_id: invoice.clientDocId || invoice.clientId || null,
    client_name: invoice.clientName ?? null,
    client_first_name: invoice.firstName ?? null,
    client_last_name: invoice.lastName ?? null,
    client_company: invoice.companyName ?? null,
    client_email: invoice.email ?? null,
    client_phone: invoice.phoneNumber ?? null,
    ...addressOutput(invoice.address),
    appointment_id: invoice.appointmentDocId ?? null,
    company_id: invoice.organizationCompanyId ?? null,
    billed_from_name: invoice.billedFrom?.companyName ?? null,
    line_items_count: (invoice.lineItems ?? []).length,
    line_items_summary: lineItemsSummary(invoice.lineItems),
    created_at: invoice.createdAt ?? null,
    updated_at: invoice.updatedAt ?? null,
    ...customFieldsOutput(invoice.customFields),
  };
}

function taskOutput(task: GenayaTask): Record<string, unknown> {
  const assignees = task.assignees ?? [];
  return {
    id: task.id,
    title: task.title ?? null,
    description: task.description ?? null,
    priority: task.priority ?? null,
    environment_id: task.environmentId ?? null,
    group_id: task.groupId ?? null,
    sub_group_id: task.subGroupId ?? null,
    assignee_ids: joinList(assignees.map((assignee) => assignee.id)),
    assignee_names: joinList(assignees.map((assignee) => assignee.name)),
    tags: joinList(task.tags ?? []),
    due_date: task.dueDate ?? null,
    end_date: task.endDate ?? null,
    created_at: task.createdAt ?? null,
    updated_at: task.updatedAt ?? null,
  };
}

// Webhook deliveries carry a thin summary of the record in data.object. Nested
// objects become prefixed columns (client.name -> client_name) and lists of
// plain values are joined.
function eventOutput(event: GenayaWebhookEvent): Record<string, unknown> {
  const object = event.data?.object;
  const record = genayaApi.isRecord(object) ? object : {};
  return {
    event_id: event.id ?? null,
    event_type: event.type ?? null,
    event_created_at: event.created ?? null,
    organization_id: event.organization_id ?? null,
    ...flatten({ value: record, prefix: '' }),
  };
}

function flatten({ value, prefix }: { value: Record<string, unknown>; prefix: string }): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    const column = prefix ? `${prefix}_${key}` : key;
    if (Array.isArray(entry)) {
      result[column] = joinList(entry.map((item) => (genayaApi.isRecord(item) ? JSON.stringify(item) : item)));
    } else if (genayaApi.isRecord(entry)) {
      Object.assign(result, flatten({ value: entry, prefix: column }));
    } else {
      result[column] = entry ?? null;
    }
  }
  return result;
}

function addressOutput(address: GenayaAddress | undefined): Record<string, string | null> {
  return {
    address_line1: address?.line1 ?? null,
    address_unit: address?.unit ?? null,
    address_city: address?.city ?? null,
    address_state: address?.state ?? null,
    address_zip: address?.zip ?? null,
    address_country: address?.country ?? null,
  };
}

function customFieldsOutput(fields: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!genayaApi.isRecord(fields)) {
    return {};
  }
  return flatten({ value: fields, prefix: 'custom_fields' });
}

function lineItemsSummary(items: GenayaLineItem[] | undefined): string | null {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  return items
    .map((item) => {
      const name = item.name || 'Item';
      const quantity = typeof item.quantity === 'number' ? `${item.quantity} x ` : '';
      const unitPrice = typeof item.unitPrice === 'number' ? ` @ ${item.unitPrice}` : '';
      const amount = typeof item.amount === 'number' ? ` = ${item.amount}` : '';
      return `${quantity}${name}${unitPrice}${amount}`;
    })
    .join('; ');
}

function joinList(values: unknown[]): string | null {
  const parts = values
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map((value) => String(value));
  return parts.length > 0 ? parts.join(', ') : null;
}

export const genayaOutput = {
  client: clientOutput,
  appointment: appointmentOutput,
  invoice: invoiceOutput,
  task: taskOutput,
  event: eventOutput,
};
