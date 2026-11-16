import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioListFiles = createAction({
  auth: bexioAuth,
  name: 'bexio_list_files',
  classification: 'SEARCH',
  displayName: 'List Files',
  description: 'List files in the Bexio inbox and file manager in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists files in the Bexio inbox and file manager in Bexio; pass order_by=id_desc for newest first. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.fileListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort by id, created_at, source_id, uuid, name or size_in_bytes, with optional _asc/_desc.' }),
    archived_state: Property.StaticDropdown<string>({ displayName: 'Archived State', description: 'Which files to include. Defaults to all.', required: false, options: { disabled: false, options: [{ label: 'All', value: 'all' }, { label: 'Archived', value: 'archived' }, { label: 'Not archived', value: 'not_archived' }] } }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/3.0/files`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by, extra: { archived_state: propsValue.archived_state ?? undefined } });
  },
});

export const bexioSearchFiles = createAction({
  auth: bexioAuth,
  name: 'bexio_search_files',
  classification: 'SEARCH',
  displayName: 'Search Files',
  description: 'Search files in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds files matching one or two field criteria (operators like, =, >, in, is_null, ...). Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.fileListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'id, uuid, created_at, name, extension, size_in_bytes, mime_type, user_id, is_archived, source_id' }),
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/3.0/files/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioGetFile = createAction({
  auth: bexioAuth,
  name: 'bexio_get_file',
  classification: 'READ',
  displayName: 'Get File',
  description: 'Get a single file (metadata only) by ID.',
  audience: 'ai',
  aiMetadata: { description: 'Fetches one file (metadata only) by its numeric ID with all fields. Use bexio_download_file for the content. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.fileOutputSchema,
  props: {
    file_id: bexioAi.idProp({ displayName: 'File ID', description: 'Numeric file ID. Find it with bexio_search_files or bexio_list_files.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/3.0/files/${bexioAi.pathId({ value: propsValue.file_id, label: 'File ID' })}` });
  },
});

export const bexioDownloadFile = createAction({
  auth: bexioAuth,
  name: 'bexio_download_file',
  classification: 'READ',
  displayName: 'Download File',
  description: 'Download the content of a stored file.',
  audience: 'ai',
  aiMetadata: { description: 'Downloads a file stored in Bexio and returns it as a file (up to 50 MB). Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.downloadOutputSchema,
  props: {
    file_id: bexioAi.idProp({ displayName: 'File ID', description: 'Numeric file ID. Find it with bexio_search_files or bexio_list_files.', required: true }),
  },
  async run({ auth, propsValue, files }) {
    const fileId = bexioAi.pathId({ value: propsValue.file_id, label: 'File ID' });
    const meta = await bexioAi.request<{ name?: string; extension?: string }>({ auth, method: HttpMethod.GET, path: `/3.0/files/${fileId}` });
    const fileName = meta.name ? (meta.extension && !meta.name.endsWith(`.${meta.extension}`) ? `${meta.name}.${meta.extension}` : meta.name) : `bexio-file-${fileId}`;
    const data = await bexioAi.downloadFile({ auth, fileId });
    const file = await files.write({ fileName, data });
    return { file, file_name: fileName, size: data.length };
  },
});

export const bexioUploadFile = createAction({
  auth: bexioAuth,
  name: 'bexio_upload_file',
  classification: 'WRITE',
  displayName: 'Upload File',
  description: 'Upload a file to the Bexio inbox.',
  audience: 'ai',
  aiMetadata: { description: 'Uploads a file to the Bexio inbox and returns the stored file record. Each call stores another copy.', idempotent: false },
  outputSchema: bexioOutputSchemas.fileArrayOutputSchema,
  props: {
    file: Property.File({ displayName: 'File', description: 'File to upload.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.uploadFile({ auth, data: propsValue.file.data, filename: propsValue.file.filename });
  },
});

export const bexioDeleteFile = createAction({
  auth: bexioAuth,
  name: 'bexio_delete_file',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete File',
  description: 'Delete a file.',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes a stored file. A second call fails.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    file_id: bexioAi.idProp({ displayName: 'File ID', description: 'Numeric file ID. Find it with bexio_search_files or bexio_list_files.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.DELETE, path: `/3.0/files/${bexioAi.pathId({ value: propsValue.file_id, label: 'File ID' })}` });
  },
});
