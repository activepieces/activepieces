import { isRecord } from './client';

function str(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function rec(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringList(value: unknown): string[] {
  return list(value).flatMap((item) => (typeof item === 'string' ? [item] : []));
}

function documentSummary(raw: unknown): DocumentSummary {
  const doc = rec(raw);
  return {
    id: str(doc['id']),
    name: str(doc['name']),
    status: str(doc['status']),
    date_created: str(doc['date_created']),
    date_modified: str(doc['date_modified']),
    date_sent: str(doc['date_sent']),
    date_completed: str(doc['date_completed']),
    expiration_date: str(doc['expiration_date']),
    version: str(doc['version']),
  };
}

function recipient(raw: unknown): DocumentRecipient {
  const r = rec(raw);
  return {
    id: str(r['id']),
    email: str(r['email']),
    first_name: str(r['first_name']),
    last_name: str(r['last_name']),
    phone: str(r['phone']),
    role: str(r['role']),
    recipient_type: str(r['recipient_type']),
    has_completed: bool(r['has_completed']),
    signing_order: num(r['signing_order']),
    contact_id: str(r['contact_id']),
    shared_link: str(r['shared_link']),
  };
}

function field(raw: unknown): DocumentField {
  const f = rec(raw);
  const assigned = rec(f['assigned_to']);
  const assignee = rec(f['assignee_details']);
  return {
    uuid: str(f['uuid']),
    name: str(f['name']),
    merge_field: str(f['merge_field']),
    field_id: str(f['field_id']),
    type: str(f['type']),
    value: f['value'] === undefined ? null : f['value'],
    is_filled: bool(f['is_filled']),
    assigned_to_email: str(assigned['email']) ?? str(assignee['email']) ?? str(f['assignee']),
    assigned_to_role: str(assigned['role']),
  };
}

function tokens(raw: unknown): { name: string | null; value: string | null }[] {
  return list(raw).map((item) => {
    const t = rec(item);
    return { name: str(t['name']), value: str(t['value']) };
  });
}

function documentDetails(raw: unknown): DocumentDetails {
  const doc = rec(raw);
  const template = rec(doc['template']);
  const createdBy = rec(doc['created_by']);
  const sentBy = rec(doc['sent_by']);
  const grandTotal = rec(doc['grand_total']);
  return {
    ...documentSummary(doc),
    ref_number: str(doc['ref_number']),
    folder_uuid: str(doc['folder_uuid']),
    template_id: str(template['id']),
    template_name: str(template['name']),
    created_by_email: str(createdBy['email']),
    sent_by_email: str(sentBy['email']),
    grand_total_amount: str(grandTotal['amount']),
    grand_total_currency: str(grandTotal['currency']),
    tags: stringList(doc['tags']),
    metadata: rec(doc['metadata']),
    tokens: tokens(doc['tokens']),
    fields: list(doc['fields']).map(field),
    recipients: list(doc['recipients']).map(recipient),
  };
}

function webhookEvent({ event, data }: { event: string; data: unknown }): WebhookDocumentEvent {
  const raw = rec(data);
  const actionBy = rec(raw['action_by']);
  const error = rec(raw['error']);
  return {
    event,
    ...documentDetails(raw),
    action_by_email: str(actionBy['email']),
    action_by_first_name: str(actionBy['first_name']),
    action_by_last_name: str(actionBy['last_name']),
    action_date: str(raw['action_date']),
    error_type: str(error['type']),
    error_detail: str(error['detail']) ?? (error['detail'] === undefined || error['detail'] === null ? null : JSON.stringify(error['detail'])),
  };
}

function attachment(raw: unknown): DocumentAttachment {
  const a = rec(raw);
  const createdBy = rec(a['created_by']);
  return {
    uuid: str(a['uuid']),
    name: str(a['name']),
    date_created: str(a['date_created']),
    type: str(a['type']),
    created_by_email: str(createdBy['email']),
  };
}

function contact(raw: unknown): Contact {
  const c = rec(raw);
  return {
    id: str(c['id']),
    email: str(c['email']),
    first_name: str(c['first_name']),
    last_name: str(c['last_name']),
    company: str(c['company']),
    job_title: str(c['job_title']),
    phone: str(c['phone']),
    country: str(c['country']),
    state: str(c['state']),
    street_address: str(c['street_address']),
    city: str(c['city']),
    postal_code: str(c['postal_code']),
  };
}

function templateSummary(raw: unknown): TemplateSummary {
  const t = rec(raw);
  return {
    id: str(t['id']),
    name: str(t['name']),
    date_created: str(t['date_created']),
    date_modified: str(t['date_modified']),
    version: str(t['version']),
  };
}

function templateDetails(raw: unknown): TemplateDetails {
  const t = rec(raw);
  const roles = list(t['roles']).map((item) => {
    const r = rec(item);
    return { id: str(r['id']), name: str(r['name']), signing_order: num(r['signing_order']) };
  });
  return {
    ...templateSummary(t),
    folder_uuid: str(t['folder_uuid']),
    tags: stringList(t['tags']),
    roles,
    fields: list(t['fields']).map(field),
    tokens: tokens(t['tokens']),
  };
}

function folder(raw: unknown): Folder {
  const f = rec(raw);
  return {
    uuid: str(f['uuid']),
    name: str(f['name']),
    date_created: str(f['date_created']),
    has_folders: bool(f['has_folders']),
    has_items: bool(f['has_items']),
  };
}

export const pandadocNormalize = {
  str,
  num,
  rec,
  list,
  documentSummary,
  documentDetails,
  webhookEvent,
  attachment,
  contact,
  templateSummary,
  templateDetails,
  folder,
  field,
  recipient,
};

export type DocumentSummary = {
  id: string | null;
  name: string | null;
  status: string | null;
  date_created: string | null;
  date_modified: string | null;
  date_sent: string | null;
  date_completed: string | null;
  expiration_date: string | null;
  version: string | null;
};

export type DocumentRecipient = {
  id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string | null;
  recipient_type: string | null;
  has_completed: boolean | null;
  signing_order: number | null;
  contact_id: string | null;
  shared_link: string | null;
};

export type DocumentField = {
  uuid: string | null;
  name: string | null;
  merge_field: string | null;
  field_id: string | null;
  type: string | null;
  value: unknown;
  is_filled: boolean | null;
  assigned_to_email: string | null;
  assigned_to_role: string | null;
};

export type DocumentDetails = DocumentSummary & {
  ref_number: string | null;
  folder_uuid: string | null;
  template_id: string | null;
  template_name: string | null;
  created_by_email: string | null;
  sent_by_email: string | null;
  grand_total_amount: string | null;
  grand_total_currency: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  tokens: { name: string | null; value: string | null }[];
  fields: DocumentField[];
  recipients: DocumentRecipient[];
};

export type WebhookDocumentEvent = DocumentDetails & {
  event: string;
  action_by_email: string | null;
  action_by_first_name: string | null;
  action_by_last_name: string | null;
  action_date: string | null;
  error_type: string | null;
  error_detail: string | null;
};

export type DocumentAttachment = {
  uuid: string | null;
  name: string | null;
  date_created: string | null;
  type: string | null;
  created_by_email: string | null;
};

export type Contact = {
  id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  job_title: string | null;
  phone: string | null;
  country: string | null;
  state: string | null;
  street_address: string | null;
  city: string | null;
  postal_code: string | null;
};

export type TemplateSummary = {
  id: string | null;
  name: string | null;
  date_created: string | null;
  date_modified: string | null;
  version: string | null;
};

export type TemplateDetails = TemplateSummary & {
  folder_uuid: string | null;
  tags: string[];
  roles: { id: string | null; name: string | null; signing_order: number | null }[];
  fields: DocumentField[];
  tokens: { name: string | null; value: string | null }[];
};

export type Folder = {
  uuid: string | null;
  name: string | null;
  date_created: string | null;
  has_folders: boolean | null;
  has_items: boolean | null;
};
