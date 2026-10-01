import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../../auth';
import {
  ZohoAuth,
  ZohoCrmError,
  ZohoListResponse,
  optionalInt,
  parseJsonObject,
  requireApiName,
  requireId,
  stringList,
  unwrapWriteItem,
  zohoRequest,
  zohoApiUrl,
  validatePaging,
} from '../../common/client';
import { downloadToFile } from '../../common/download';
import { flattenAttachment } from '../../common/flatten';
import { defaultFieldSelection } from '../../common/metadata';
import { tryListFields, uploadAttachment } from '../../common/records';
import {
  downloadAttachmentOutputSchema,
  linkRelatedOutputSchema,
  listAttachmentsOutputSchema,
  relatedRecordsOutputSchema,
} from '../../output-schemas-ai';
import { childWriteOutputSchema } from '../../output-schemas';

const ATTACHMENT_FIELDS = 'id,File_Name,Size,Created_Time,Modified_Time,Owner,Created_By,$file_id,$se_module,$type,$link_url';

const moduleApiName = Property.ShortText({
  displayName: 'Module API Name',
  description: 'Module API name of the parent record, e.g. "Accounts" or "Leads".',
  required: true,
});
const recordId = Property.ShortText({ displayName: 'Record ID', description: 'Numeric id of the parent record.', required: true });
const relatedList = Property.ShortText({
  displayName: 'Related List API Name',
  description: 'api_name from Get Related Lists, e.g. "Contacts", "Deals", "Campaigns", "Products".',
  required: true,
});

async function relatedModuleFields({ auth, module, related }: { auth: ZohoAuth; module: string; related: string }): Promise<string[]> {
  const body = await zohoRequest<{ related_lists?: { api_name?: string; module?: { api_name?: string } }[] }>({
    auth,
    method: HttpMethod.GET,
    path: '/settings/related_lists',
    query: { module },
  });
  const target = body?.related_lists?.find((r) => r.api_name === related)?.module?.api_name;
  if (!target) return ['id'];
  const fields = await tryListFields({ auth, module: target });
  return fields ? defaultFieldSelection({ fields }) : ['id'];
}

export const listRelatedRecordsAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_list_related_records',
  classification: 'SEARCH',
  displayName: 'List Related Records',
  description: 'Lists records in a related list of a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the records in one related list of a Zoho CRM record, e.g. the Contacts or Deals of an Account, one page of up to 200 (at most 50 fields per record; default id, then custom fields, then standard fields of the related module). Get related_list_api_name from Get Related Lists. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    related_list_api_name: relatedList,
    fields: Property.Array({ displayName: 'Fields', description: 'Field API names to return (max 50).', required: false }),
    page: Property.Number({ displayName: 'Page', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1 to 200 (default 50).', required: false }),
    page_token: Property.ShortText({ displayName: 'Page Token', description: 'next_page_token from a previous call (beyond 2,000 records).', required: false }),
  },
  outputSchema: relatedRecordsOutputSchema,
  async run({ auth, propsValue: p }) {
    const module = requireApiName({ value: p.module_api_name, name: 'module_api_name' });
    const id = requireId({ value: p.record_id, name: 'record_id' });
    const related = requireApiName({ value: p.related_list_api_name, name: 'related_list_api_name' });
    const page = optionalInt({ value: p.page, name: 'page', min: 1, max: 2000 });
    const perPage = optionalInt({ value: p.per_page, name: 'per_page', min: 1, max: 200 }) ?? 50;
    const pageToken = p.page_token?.trim() || undefined;
    validatePaging({ page, perPage, pageToken, tokenSupported: true });
    let fields = stringList(p.fields).map((f) => requireApiName({ value: f, name: 'fields' }));
    if (fields.length > 50) throw new ZohoCrmError('Zoho returns at most 50 fields per call.');
    if (fields.length === 0) fields = await relatedModuleFields({ auth, module, related });
    const body = await zohoRequest<ZohoListResponse<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: `/${encodeURIComponent(module)}/${id}/${encodeURIComponent(related)}`,
      query: {
        fields: fields.join(','),
        per_page: String(perPage),
        ...(page ? { page: String(page) } : {}),
        ...(pageToken ? { page_token: pageToken } : {}),
      },
    });
    const records = body?.data ?? [];
    return {
      module,
      record_id: id,
      related_list: related,
      records,
      count: records.length,
      more_records: body?.info?.more_records === true,
      next_page_token: body?.info?.next_page_token ?? null,
    };
  },
});

export const linkRelatedRecordAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_link_related_record',
  classification: 'WRITE',
  displayName: 'Link Related Record',
  description: 'Associates a record with another record through a related list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Associates an existing record with a Zoho CRM record through a related list, or updates the relation\'s own fields (e.g. add a Contact to a Campaign with a Member_Status, or a Product to a Deal). Supported relations include Campaigns with Leads/Contacts and Products with Leads/Accounts/Contacts/Deals/Price Books. Idempotent: linking the same pair again leaves one link.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    related_list_api_name: relatedList,
    related_record_id: Property.ShortText({ displayName: 'Related Record ID', description: 'Id of the record to link.', required: true }),
    relation_fields: Property.Json({ displayName: 'Relation Fields', description: 'Optional fields of the relation, e.g. {"Member_Status": "Invited"}.', required: false }),
  },
  outputSchema: linkRelatedOutputSchema,
  async run({ auth, propsValue: p }) {
    const module = requireApiName({ value: p.module_api_name, name: 'module_api_name' });
    const id = requireId({ value: p.record_id, name: 'record_id' });
    const related = requireApiName({ value: p.related_list_api_name, name: 'related_list_api_name' });
    const relatedId = requireId({ value: p.related_record_id, name: 'related_record_id' });
    const body = await zohoRequest<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/${encodeURIComponent(module)}/${id}/${encodeURIComponent(related)}`,
      body: { data: [{ ...parseJsonObject({ value: p.relation_fields, name: 'relation_fields' }), id: relatedId }] },
    });
    const item = unwrapWriteItem({ body });
    return {
      module,
      record_id: id,
      related_list: related,
      related_record_id: relatedId,
      status: item.status ?? null,
      code: item.code ?? null,
      message: item.message ?? null,
    };
  },
});

export const listAttachmentsAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_list_attachments',
  classification: 'SEARCH',
  displayName: 'List Attachments',
  description: 'Lists the attachments of a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the attachments of one Zoho CRM record (file name, size, type, link URL, owner, attachment id), one page of up to 200 (page numbers reach the first 2,000). Use to find the attachment_id for Download Attachment; a "Link URL" attachment cannot be downloaded and carries its link_url instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    page: Property.Number({ displayName: 'Page', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1 to 200 (default 50).', required: false }),
  },
  outputSchema: listAttachmentsOutputSchema,
  async run({ auth, propsValue: p }) {
    const module = requireApiName({ value: p.module_api_name, name: 'module_api_name' });
    const id = requireId({ value: p.record_id, name: 'record_id' });
    const page = optionalInt({ value: p.page, name: 'page', min: 1, max: 2000 });
    const perPage = optionalInt({ value: p.per_page, name: 'per_page', min: 1, max: 200 }) ?? 50;
    validatePaging({ page, perPage, tokenSupported: false });
    const body = await zohoRequest<ZohoListResponse<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: `/${encodeURIComponent(module)}/${id}/Attachments`,
      query: { fields: ATTACHMENT_FIELDS, per_page: String(perPage), ...(page ? { page: String(page) } : {}) },
    });
    const attachments = (body?.data ?? []).map(flattenAttachment);
    return { attachments, count: attachments.length, more_records: body?.info?.more_records === true };
  },
});

export const uploadAttachmentAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_upload_attachment',
  classification: 'WRITE',
  displayName: 'Attach Link',
  description: 'Attaches a URL to a record as a link attachment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a link attachment (a public http(s) URL plus an optional title) to one Zoho CRM record. Use to attach a document that lives online; Zoho stores the link, not a copy of the file. Not idempotent: each call adds another attachment.',
    idempotent: false,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    attachment_url: Property.ShortText({ displayName: 'Attachment URL', description: 'Full URL, e.g. "https://example.com/proposal.pdf".', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
  },
  outputSchema: childWriteOutputSchema,
  async run({ auth, propsValue: p }) {
    return uploadAttachment({
      auth,
      module: requireApiName({ value: p.module_api_name, name: 'module_api_name' }),
      recordId: requireId({ value: p.record_id, name: 'record_id' }),
      attachmentUrl: p.attachment_url,
      title: p.title,
    });
  },
});

export const downloadAttachmentAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_download_attachment',
  classification: 'READ',
  displayName: 'Download Attachment',
  description: 'Downloads a file attachment of a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Downloads one file attachment of a Zoho CRM record by attachment id (from List Attachments) and returns it as a stored file. Link attachments cannot be downloaded. The file size limit of this Activepieces deployment applies. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    record_id: recordId,
    attachment_id: Property.ShortText({ displayName: 'Attachment ID', required: true }),
  },
  outputSchema: downloadAttachmentOutputSchema,
  async run({ auth, propsValue: p, files }) {
    const module = requireApiName({ value: p.module_api_name, name: 'module_api_name' });
    const id = requireId({ value: p.record_id, name: 'record_id' });
    const attachmentId = requireId({ value: p.attachment_id, name: 'attachment_id' });
    const downloaded = await downloadToFile({
      auth,
      url: zohoApiUrl({ auth, path: `/${encodeURIComponent(module)}/${id}/Attachments/${attachmentId}` }),
      files,
      fallbackName: `attachment-${attachmentId}`,
    });
    return {
      file: downloaded.file,
      file_name: downloaded.fileName,
      size: downloaded.size,
      content_type: downloaded.contentType,
    };
  },
});
