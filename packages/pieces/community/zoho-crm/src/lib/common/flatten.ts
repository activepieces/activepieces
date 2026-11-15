import { isRecord } from './client';

function obj(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function str(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function emailOf(value: unknown): string | null {
  if (typeof value === 'string') return value;
  return str(obj(value)['email']);
}

function emailList(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const list = value.map(emailOf).filter((v): v is string => v !== null);
  return list.length > 0 ? list.join(', ') : null;
}

export function flattenUser(u: Record<string, unknown>): Record<string, unknown> {
  const role = obj(u['role']);
  const profile = obj(u['profile']);
  return {
    id: str(u['id']),
    full_name: str(u['full_name']),
    first_name: str(u['first_name']),
    last_name: str(u['last_name']),
    email: str(u['email']),
    status: str(u['status']),
    role_id: str(role['id']),
    role_name: str(role['name']),
    profile_id: str(profile['id']),
    profile_name: str(profile['name']),
    time_zone: str(u['time_zone']),
    confirm: typeof u['confirm'] === 'boolean' ? u['confirm'] : null,
  };
}

export function flattenNote(n: Record<string, unknown>): Record<string, unknown> {
  const parent = obj(n['Parent_Id']);
  const parentModule = obj(parent['module']);
  const owner = obj(n['Owner']);
  return {
    id: str(n['id']),
    title: str(n['Note_Title']),
    content: str(n['Note_Content']),
    parent_id: str(parent['id']),
    parent_name: str(parent['name']),
    parent_module: str(parentModule['api_name']) ?? str(n['$se_module']),
    owner_id: str(owner['id']),
    owner_name: str(owner['name']),
    created_time: str(n['Created_Time']),
    modified_time: str(n['Modified_Time']),
  };
}

export function flattenAttachment(a: Record<string, unknown>): Record<string, unknown> {
  const owner = obj(a['Owner']);
  const createdBy = obj(a['Created_By']);
  const size = a['Size'];
  return {
    id: str(a['id']),
    file_name: str(a['File_Name']),
    size: typeof size === 'number' ? size : typeof size === 'string' && size !== '' ? Number(size) : null,
    file_id: str(a['$file_id']),
    type: str(a['$type']),
    link_url: str(a['$link_url']),
    created_time: str(a['Created_Time']),
    modified_time: str(a['Modified_Time']),
    owner_name: str(owner['name']),
    created_by_name: str(createdBy['name']),
    parent_module: str(a['$se_module']),
  };
}

export function flattenDraft(d: Record<string, unknown>): Record<string, unknown> {
  const schedule = obj(d['schedule_details']);
  const attachments = Array.isArray(d['attachments']) ? d['attachments'] : [];
  return {
    id: str(d['id']),
    subject: str(d['subject']),
    from: emailOf(d['from']),
    to: emailList(d['to']),
    cc: emailList(d['cc']),
    bcc: emailList(d['bcc']),
    reply_to: emailOf(d['reply_to']),
    summary: str(d['summary']),
    content: str(d['content']),
    rich_text: typeof d['rich_text'] === 'boolean' ? d['rich_text'] : null,
    scheduled_time: str(schedule['time']),
    attachment_count: attachments.length,
    created_time: str(d['created_time']),
    modified_time: str(d['modified_time']),
  };
}

export function flattenRelatedList(r: Record<string, unknown>): Record<string, unknown> {
  return {
    api_name: str(r['api_name']),
    display_label: str(r['display_label']),
    module_api_name: str(obj(r['module'])['api_name']),
    type: str(r['type']),
    href: str(r['href']),
    status: str(r['status']),
    id: str(r['id']),
  };
}
