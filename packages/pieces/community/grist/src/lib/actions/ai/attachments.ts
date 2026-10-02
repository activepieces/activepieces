import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristDownloadAttachmentsArchiveOutputSchema, gristListAttachmentsOutputSchema, gristDeleteColumnOutputSchema, gristUploadAttachmentOutputSchema } from '../../output-schemas';

export const gristListAttachmentsAction = createAction({
  auth: gristAuth,
  name: 'grist_list_attachments',
  outputSchema: gristListAttachmentsOutputSchema,
  displayName: 'List Attachments',
  description: 'Lists the attachments stored in a document.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns metadata (ID, file name, size, upload time) of the attachments in a document. Use it to get the attachment ID for **Download Attachment**.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    sort: Property.ShortText({
      displayName: 'Sort',
      description:
        'Optional comma-separated fields, prefix `-` for descending.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, sort, limit } = context.propsValue;
    const response = await client.makeRequest<{
      records: { id: number; fields: Record<string, unknown> }[];
    }>(HttpMethod.GET, `/docs/${documentId}/attachments`, undefined, {
      sort: sort || undefined,
      limit: limit ?? undefined,
    });
    return { attachments: response.records, count: response.records.length };
  },
});

export const gristDownloadAttachmentAction = createAction({
  auth: gristAuth,
  name: 'grist_download_attachment',
  outputSchema: gristDownloadAttachmentsArchiveOutputSchema,
  displayName: 'Download Attachment',
  description: 'Downloads one attachment as a file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Downloads the contents of one attachment by ID and returns a file reference plus its name. Get the ID from **List Attachments** or a record's Attachments cell.",
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    attachmentId: Property.Number({
      displayName: 'Attachment ID',
      required: true,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, attachmentId } = context.propsValue;
    const metadata = await client.makeRequest<{ fileName?: string }>(
      HttpMethod.GET,
      `/docs/${documentId}/attachments/${attachmentId}`,
      undefined,
      undefined
    );
    const content = await client.download(
      `/docs/${documentId}/attachments/${attachmentId}/download`
    );
    const fileName = metadata.fileName ?? `attachment-${attachmentId}`;
    const file = await context.files.write({ fileName, data: content });
    return { file, file_name: fileName, size: content.length };
  },
});

export const gristDownloadAttachmentsArchiveAction = createAction({
  auth: gristAuth,
  name: 'grist_download_attachments_archive',
  outputSchema: gristDownloadAttachmentsArchiveOutputSchema,
  displayName: 'Download Attachments Archive',
  description: 'Downloads all attachments of a document as one archive.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads every attachment in a document as a single zip or tar file. Can be large; prefer **Download Attachment** when you need one file.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'zip',
      options: {
        options: [
          { label: 'Zip', value: 'zip' },
          { label: 'Tar', value: 'tar' },
        ],
      },
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, format } = context.propsValue;
    const extension = format ?? 'zip';
    const content = await client.download(
      `/docs/${documentId}/attachments/archive`,
      { format: extension }
    );
    const fileName = `${documentId}-attachments.${extension}`;
    const file = await context.files.write({ fileName, data: content });
    return { file, file_name: fileName, size: content.length };
  },
});

export const gristUploadAttachmentAction = createAction({
  auth: gristAuth,
  name: 'grist_upload_attachment',
  outputSchema: gristUploadAttachmentOutputSchema,
  displayName: 'Upload Attachment',
  description: 'Uploads a file to a document.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a file into a Grist document and returns its attachment ID and metadata. To show it in a table, set an Attachments column cell to `["L", <attachmentId>]` with **Update Records**. Not idempotent: each call stores a new attachment.',
    idempotent: false,
  },
  props: {
    documentId: commonProps.document_id_text,
    attachment: Property.File({
      displayName: 'Attachment',
      required: true,
    }),
    attachmentName: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Overrides the file name.',
      required: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, attachment, attachmentName } = context.propsValue;
    const formData = new FormData();
    formData.append(
      'upload',
      Buffer.from(attachment.base64, 'base64'),
      attachmentName || attachment.filename
    );
    const uploaded = await client.makeRequest<number[]>(
      HttpMethod.POST,
      `/docs/${documentId}/attachments`,
      { ...formData.getHeaders() },
      undefined,
      formData
    );
    const id = uploaded[0];
    const metadata = await client.makeRequest<{ fileName?: string }>(
      HttpMethod.GET,
      `/docs/${documentId}/attachments/${id}`,
      undefined,
      undefined
    );
    return { id, fields: metadata };
  },
});

export const gristRemoveUnusedAttachmentsAction = createAction({
  auth: gristAuth,
  name: 'grist_remove_unused_attachments',
  outputSchema: gristDeleteColumnOutputSchema,
  displayName: 'Remove Unused Attachments',
  description: 'Deletes attachments that no cell references.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes ALL attachments in a document that no Attachments cell references (it cannot target one attachment). To delete a specific file, first clear its cell with **Update Records**, then run this. Repeating it is harmless.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    expiredOnly: Property.Checkbox({
      displayName: 'Expired Only',
      description:
        'Only remove attachments unreferenced for longer than the server retention period.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, expiredOnly } = context.propsValue;
    await client.makeRequest(
      HttpMethod.POST,
      `/docs/${documentId}/attachments/removeUnused`,
      undefined,
      { expiredOnly: expiredOnly ? 'true' : undefined }
    );
    return { success: true };
  },
});
