import { closeClient } from './client';

const APP_URL = 'https://app.close.com';

function recordOf(value: unknown): Record<string, unknown> {
  return closeClient.isRecord(value) ? value : {};
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function customOf(raw: Record<string, unknown>): Record<string, unknown> {
  const fromPrefixed = Object.fromEntries(
    Object.entries(raw)
      .filter(([key]) => key.startsWith('custom.'))
      .map(([key, value]) => [key.slice('custom.'.length), value]),
  );
  return { ...fromPrefixed };
}

function withCustomMap({ objectType, record }: { objectType: 'lead' | 'contact' | 'opportunity'; record: unknown }): unknown {
  if (objectType === 'lead' || !closeClient.isRecord(record)) return record;
  return { ...record, custom: customOf(record) };
}

function emails(value: unknown) {
  return arrayOf(value).map((e) => {
    const r = recordOf(e);
    return { email: str(r['email']), type: str(r['type']) };
  });
}

function phones(value: unknown) {
  return arrayOf(value).map((p) => {
    const r = recordOf(p);
    return { phone: str(r['phone']), phoneFormatted: str(r['phone_formatted']), type: str(r['type']) };
  });
}

function urls(value: unknown) {
  return arrayOf(value).map((u) => {
    const r = recordOf(u);
    return { url: str(r['url']), type: str(r['type']) };
  });
}

function contact(raw: unknown) {
  const c = recordOf(raw);
  return {
    id: str(c['id']),
    leadId: str(c['lead_id']),
    name: str(c['name']),
    title: str(c['title']),
    emails: emails(c['emails']),
    phones: phones(c['phones']),
    urls: urls(c['urls']),
    primaryEmail: str(recordOf(arrayOf(c['emails'])[0])['email']),
    primaryPhone: str(recordOf(arrayOf(c['phones'])[0])['phone']),
    custom: customOf(c),
    dateCreated: str(c['date_created']),
    dateUpdated: str(c['date_updated']),
  };
}

function lead(raw: unknown) {
  const l = recordOf(raw);
  const id = str(l['id']);
  return {
    id,
    name: str(l['display_name']) ?? str(l['name']),
    description: str(l['description']),
    url: str(l['url']),
    statusId: str(l['status_id']),
    statusLabel: str(l['status_label']),
    contacts: arrayOf(l['contacts']).map(contact),
    opportunityIds: arrayOf(l['opportunities']).map((o) => str(recordOf(o)['id'])).filter((v): v is string => v !== null),
    addresses: arrayOf(l['addresses']).map(recordOf),
    custom: { ...recordOf(l['custom']), ...customOf(l) },
    createdBy: str(l['created_by']),
    dateCreated: str(l['date_created']),
    dateUpdated: str(l['date_updated']),
    appUrl: id ? `${APP_URL}/lead/${encodeURIComponent(id)}/` : null,
  };
}

function opportunity(raw: unknown) {
  const o = recordOf(raw);
  return {
    id: str(o['id']),
    leadId: str(o['lead_id']),
    leadName: str(o['lead_name']),
    contactId: str(o['contact_id']),
    userId: str(o['user_id']),
    userName: str(o['user_name']),
    statusId: str(o['status_id']),
    statusLabel: str(o['status_label']),
    statusType: str(o['status_type']),
    pipelineId: str(o['pipeline_id']),
    pipelineName: str(o['pipeline_name']),
    valueCents: num(o['value']),
    valueCurrency: str(o['value_currency']),
    valueFormatted: str(o['value_formatted']),
    valuePeriod: str(o['value_period']),
    confidence: num(o['confidence']),
    note: str(o['note']),
    dateWon: str(o['date_won']),
    dateLost: str(o['date_lost']),
    custom: customOf(o),
    dateCreated: str(o['date_created']),
    dateUpdated: str(o['date_updated']),
  };
}

function task(raw: unknown) {
  const t = recordOf(raw);
  return {
    id: str(t['id']),
    type: str(t['_type']),
    leadId: str(t['lead_id']),
    leadName: str(t['lead_name']),
    contactId: str(t['contact_id']),
    assignedTo: str(t['assigned_to']),
    assignedToName: str(t['assigned_to_name']),
    text: str(t['text']),
    date: str(t['date']),
    isComplete: bool(t['is_complete']),
    isDateless: bool(t['is_dateless']),
    dateCreated: str(t['date_created']),
    dateUpdated: str(t['date_updated']),
  };
}

function activity(raw: unknown) {
  const a = recordOf(raw);
  const email = recordOf(a['envelope']);
  return {
    id: str(a['id']),
    type: str(a['_type']),
    leadId: str(a['lead_id']),
    contactId: str(a['contact_id']),
    userId: str(a['user_id']),
    userName: str(a['user_name']),
    direction: str(a['direction']),
    status: str(a['status']),
    subject: str(a['subject']) ?? str(a['title']) ?? str(email['subject']),
    text: str(a['note']) ?? str(a['text']) ?? str(a['body_text']),
    durationSeconds: num(a['duration']),
    phone: str(a['phone']) ?? str(a['remote_phone']),
    activityAt: str(a['activity_at']),
    dateCreated: str(a['date_created']),
    dateUpdated: str(a['date_updated']),
  };
}

function user(raw: unknown) {
  const u = recordOf(raw);
  const name = [str(u['first_name']), str(u['last_name'])].filter((p): p is string => !!p && p.trim() !== '').join(' ').trim();
  return {
    id: str(u['id']),
    email: str(u['email']),
    firstName: str(u['first_name']),
    lastName: str(u['last_name']),
    name: name === '' ? null : name,
    organizationIds: arrayOf(u['organizations']).map((o) => (typeof o === 'string' ? o : str(recordOf(o)['id']))).filter((v): v is string => v !== null),
    dateCreated: str(u['date_created']),
  };
}

function status(raw: unknown) {
  const s = recordOf(raw);
  return { id: str(s['id']), label: str(s['label']), type: str(s['type']), pipelineId: str(s['pipeline_id']) };
}

function pipeline(raw: unknown) {
  const p = recordOf(raw);
  return { id: str(p['id']), name: str(p['name']), statuses: arrayOf(p['statuses']).map(status) };
}

function customField(raw: unknown) {
  const f = recordOf(raw);
  return {
    id: str(f['id']),
    name: str(f['name']),
    type: str(f['type']),
    description: str(f['description']),
    acceptsMultipleValues: f['accepts_multiple_values'] === true,
    choices: arrayOf(f['choices']).filter((c): c is string => typeof c === 'string'),
  };
}

function offsetPage<T>({ items, hasMore, nextSkip, map }: { items: unknown[]; hasMore: boolean; nextSkip: number | null; map: (item: unknown) => T }) {
  const mapped = items.map(map);
  return { items: mapped, count: mapped.length, hasMore, nextSkip };
}

function cursorPage<T>({ items, hasMore, nextCursor, map }: { items: unknown[]; hasMore: boolean; nextCursor: string | null; map: (item: unknown) => T }) {
  const mapped = items.map(map);
  return { items: mapped, count: mapped.length, hasMore, nextCursor };
}

export const closeMappers = {
  withCustomMap,
  lead,
  contact,
  opportunity,
  task,
  activity,
  user,
  status,
  pipeline,
  customField,
  offsetPage,
  cursorPage,
  recordOf,
  arrayOf,
  str,
  num,
  bool,
  APP_URL,
};
