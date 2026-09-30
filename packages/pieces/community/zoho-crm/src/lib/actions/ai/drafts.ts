import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../../auth';
import {
  ZohoAuth,
  ZohoCrmError,
  optionalInt,
  readField,
  readString,
  requireApiName,
  requireId,
  requireKey,
  stringList,
  unwrapWriteItem,
  zohoRequest,
  validatePaging,
} from '../../common/client';
import { flattenDraft } from '../../common/flatten';
import { draftWriteOutputSchema, listDraftsOutputSchema } from '../../output-schemas-ai';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const moduleApiName = Property.ShortText({
  displayName: 'Module API Name',
  description: 'Module of the record, e.g. "Leads", "Contacts", "Deals" or "Accounts".',
  required: true,
});
const recordId = Property.ShortText({ displayName: 'Record ID', description: 'Numeric id of the record the draft belongs to.', required: true });
const draftId = Property.ShortText({ displayName: 'Draft ID', description: 'Draft id from List Email Drafts (a long hex string).', required: true });

function email({ value, name }: { value: unknown; name: string }): string {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!EMAIL_RE.test(s)) throw new ZohoCrmError(`${name} must be an email address.`);
  return s;
}

function recipients({ value, name }: { value: unknown; name: string }): { email: string }[] | undefined {
  if (value === undefined || value === null) return undefined;
  return stringList(value).map((v) => ({ email: email({ value: v, name }) }));
}

function replacementRecipients({ value, name }: { value: unknown; name: string }): { email: string }[] | undefined {
  const list = recipients({ value, name });
  if (list !== undefined && list.length === 0) {
    throw new ZohoCrmError(`${name} is empty. Zoho keeps a draft's ${name} recipients when asked to remove them all, so pass the new addresses, or leave ${name} out to keep the current list.`);
  }
  return list;
}

function draftPath({ module, id }: { module: string; id: string }): string {
  return `/${encodeURIComponent(module)}/${id}/__email_drafts`;
}

async function fetchDraft({ auth, module, id, draft }: { auth: ZohoAuth; module: string; id: string; draft: string }): Promise<Record<string, unknown>> {
  const body = await zohoRequest<{ __email_drafts?: Record<string, unknown>[] }>({
    auth,
    method: HttpMethod.GET,
    path: `${draftPath({ module, id })}/${draft}`,
  });
  const found = body?.__email_drafts?.[0];
  if (!found) throw new ZohoCrmError(`No draft ${draft} on ${module} ${id}.`, 404, 'NOT_FOUND');
  return found;
}

function toRecipientObjects(value: unknown): { email: string; user_name?: string }[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((v) => {
    if (typeof v === 'string') return [{ email: v }];
    const address = readString(readField({ value: v, key: 'email' }));
    if (address === undefined) return [];
    const userName = readString(readField({ value: v, key: 'user_name' }));
    return [{ email: address, ...(userName !== undefined ? { user_name: userName } : {}) }];
  });
}

function emailFrom(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  return readString(readField({ value, key: 'email' }));
}

export function mergeDraft({
  current,
  changes,
  draft,
}: {
  current: Record<string, unknown>;
  changes: DraftChanges;
  draft: string;
}): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    id: draft,
    from: changes.from ?? emailFrom(current['from']),
    rich_text: changes.rich_text ?? (typeof current['rich_text'] === 'boolean' ? current['rich_text'] : true),
  };
  const to = changes.to ?? toRecipientObjects(current['to']);
  const cc = changes.cc ?? toRecipientObjects(current['cc']);
  const bcc = changes.bcc ?? toRecipientObjects(current['bcc']);
  if (to) merged['to'] = to;
  if (cc) merged['cc'] = cc;
  if (bcc) merged['bcc'] = bcc;
  const subject = changes.subject ?? current['subject'];
  const content = changes.content ?? current['content'];
  const replyTo = changes.reply_to ?? emailFrom(current['reply_to']);
  if (typeof subject === 'string') merged['subject'] = subject;
  if (typeof content === 'string') merged['content'] = content;
  if (replyTo) merged['reply_to'] = replyTo;
  if (current['schedule_details']) merged['schedule_details'] = current['schedule_details'];
  if (Array.isArray(current['attachments']) && current['attachments'].length > 0) {
    merged['attachments'] = current['attachments'];
  }
  if (!merged['from']) throw new ZohoCrmError('The draft has no from address; pass from.');
  return merged;
}

const richTextProp = (forUpdate: boolean) =>
  Property.StaticDropdown({
    displayName: 'Content Format',
    description: forUpdate ? 'Leave empty to keep the current format.' : 'HTML (rich text) or plain text. Default HTML.',
    required: false,
    options: { options: [{ label: 'HTML', value: 'true' }, { label: 'Plain text', value: 'false' }] },
  });

function richText(value: unknown): boolean | undefined {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

export const createEmailDraftAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_create_email_draft',
  classification: 'WRITE',
  displayName: 'Create Email Draft',
  description: 'Saves an email draft on a record without sending it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Saves an email draft (from, to, cc, bcc, subject, body) in the Emails related list of one Zoho CRM record, without sending it; a person can review and send it from the CRM. The from address must be one the connected user may send from (their own email, see Get Current User). Not idempotent: each call saves another draft.',
    idempotent: false,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    from: Property.ShortText({ displayName: 'From', description: 'Sender email, e.g. the connected user\'s email.', required: true }),
    to: Property.Array({ displayName: 'To', description: 'Recipient emails.', required: false }),
    cc: Property.Array({ displayName: 'Cc', required: false }),
    bcc: Property.Array({ displayName: 'Bcc', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    content: Property.LongText({ displayName: 'Body', required: false }),
    rich_text: richTextProp(false),
    reply_to: Property.ShortText({ displayName: 'Reply To', required: false }),
  },
  outputSchema: draftWriteOutputSchema,
  async run({ auth, propsValue: p }) {
    const module = requireApiName({ value: p.module_api_name, name: 'module_api_name' });
    const id = requireId({ value: p.record_id, name: 'record_id' });
    const to = recipients({ value: p.to, name: 'to' });
    const cc = recipients({ value: p.cc, name: 'cc' });
    const bcc = recipients({ value: p.bcc, name: 'bcc' });
    const draft: Record<string, unknown> = {
      from: email({ value: p.from, name: 'from' }),
      rich_text: richText(p.rich_text) ?? true,
      ...(to && to.length > 0 ? { to } : {}),
      ...(cc && cc.length > 0 ? { cc } : {}),
      ...(bcc && bcc.length > 0 ? { bcc } : {}),
      ...(p.subject ? { subject: p.subject } : {}),
      ...(p.content ? { content: p.content } : {}),
      ...(p.reply_to ? { reply_to: email({ value: p.reply_to, name: 'reply_to' }) } : {}),
    };
    const body = await zohoRequest<unknown>({ auth, method: HttpMethod.POST, path: draftPath({ module, id }), body: { __email_drafts: [draft] } });
    const item = unwrapWriteItem({ body, key: '__email_drafts' });
    return { id: readString(item.details?.['id']) ?? null, module, record_id: id, status: item.status ?? null, message: item.message ?? null };
  },
});

export const listEmailDraftsAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_list_email_drafts',
  classification: 'SEARCH',
  displayName: 'List Email Drafts',
  description: 'Lists the email drafts saved on a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists email drafts saved on one Zoho CRM record (at most 10 per page), or returns one draft when draft_id is given. Use to find a draft id before Update Email Draft. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    draft_id: Property.ShortText({ displayName: 'Draft ID', description: 'Optional: return only this draft.', required: false }),
    page: Property.Number({ displayName: 'Page', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1 to 10 (Zoho maximum 10).', required: false }),
  },
  outputSchema: listDraftsOutputSchema,
  async run({ auth, propsValue: p }) {
    const module = requireApiName({ value: p.module_api_name, name: 'module_api_name' });
    const id = requireId({ value: p.record_id, name: 'record_id' });
    const draft = p.draft_id ? requireKey({ value: p.draft_id, name: 'draft_id' }) : undefined;
    const page = optionalInt({ value: p.page, name: 'page', min: 1, max: 2000 });
    const perPage = optionalInt({ value: p.per_page, name: 'per_page', min: 1, max: 10 });
    validatePaging({ page, perPage: perPage ?? 10, tokenSupported: false });
    const body = await zohoRequest<{ __email_drafts?: Record<string, unknown>[]; info?: { more_records?: boolean } }>({
      auth,
      method: HttpMethod.GET,
      path: draft ? `${draftPath({ module, id })}/${draft}` : draftPath({ module, id }),
      query: draft ? undefined : { ...(page ? { page: String(page) } : {}), ...(perPage ? { per_page: String(perPage) } : {}) },
    });
    const drafts = (body?.__email_drafts ?? []).map(flattenDraft);
    return { drafts, count: drafts.length, more_records: body?.info?.more_records === true };
  },
});

export const updateEmailDraftAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_update_email_draft',
  classification: 'WRITE',
  displayName: 'Update Email Draft',
  description: 'Changes an email draft; fields you leave empty keep their value.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes an existing email draft on a Zoho CRM record without sending it; it reads the draft first and keeps every field you do not pass (recipients, subject, body, attachments, schedule). A recipient list you pass replaces that list; Zoho cannot empty a list, so an empty list is refused. Idempotent: the same changes give the same draft.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    draft_id: draftId,
    from: Property.ShortText({ displayName: 'From', required: false }),
    to: Property.Array({ displayName: 'To', description: 'Replaces the To list; omit it to keep the current list.', required: false }),
    cc: Property.Array({ displayName: 'Cc', description: 'Replaces the Cc list; omit it to keep the current list.', required: false }),
    bcc: Property.Array({ displayName: 'Bcc', description: 'Replaces the Bcc list; omit it to keep the current list.', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    content: Property.LongText({ displayName: 'Body', required: false }),
    rich_text: richTextProp(true),
    reply_to: Property.ShortText({ displayName: 'Reply To', required: false }),
  },
  outputSchema: draftWriteOutputSchema,
  async run({ auth, propsValue: p }) {
    const module = requireApiName({ value: p.module_api_name, name: 'module_api_name' });
    const id = requireId({ value: p.record_id, name: 'record_id' });
    const draft = requireKey({ value: p.draft_id, name: 'draft_id' });
    const changes: DraftChanges = {
      from: p.from ? email({ value: p.from, name: 'from' }) : undefined,
      to: replacementRecipients({ value: p.to, name: 'to' }),
      cc: replacementRecipients({ value: p.cc, name: 'cc' }),
      bcc: replacementRecipients({ value: p.bcc, name: 'bcc' }),
      subject: p.subject || undefined,
      content: p.content || undefined,
      rich_text: richText(p.rich_text),
      reply_to: p.reply_to ? email({ value: p.reply_to, name: 'reply_to' }) : undefined,
    };
    const current = await fetchDraft({ auth, module, id, draft });
    const merged = mergeDraft({ current, changes, draft });
    const body = await zohoRequest<unknown>({ auth, method: HttpMethod.PUT, path: draftPath({ module, id }), body: { __email_drafts: [merged] } });
    const item = unwrapWriteItem({ body, key: '__email_drafts' });
    return { id: readString(item.details?.['id']) ?? draft, module, record_id: id, status: item.status ?? null, message: item.message ?? null };
  },
});

type DraftChanges = {
  from?: string;
  to?: { email: string }[];
  cc?: { email: string }[];
  bcc?: { email: string }[];
  subject?: string;
  content?: string;
  rich_text?: boolean;
  reply_to?: string;
};
