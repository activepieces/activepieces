import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { airtableAuth } from '../auth';

export const airtableUploadAttachmentAiAction = createAction({
  auth: airtableAuth,
  name: 'upload_attachment_ai',
  displayName: 'Upload Attachment (Agent)',
  description: 'Upload a file into an attachment field on a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads a file (base64-encoded content) into a multiple-attachments field on an existing record. Provide the attachment field ID (from Get Base Schema (Agent)), the record ID, the base64 content, its MIME content type, and a filename. Each call adds a new attachment, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    base_id: Property.ShortText({
      displayName: 'Base ID',
      description:
        'The Airtable base ID (e.g. "appXXXXXXXXXXXXXX"). Resolve it with List Bases (Agent).',
      required: true,
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description:
        'The record ID (e.g. "recXXXXXXXXXXXXXX") to attach the file to.',
      required: true,
    }),
    attachment_field_id: Property.ShortText({
      displayName: 'Attachment Field ID',
      description:
        'The field ID (e.g. "fldXXXXXXXXXXXXXX") of a multiple-attachments column. Resolve it with Get Base Schema (Agent) (pick a field whose type is multipleAttachments).',
      required: true,
    }),
    file: Property.ShortText({
      displayName: 'File (Base64)',
      description:
        'The file content encoded as a base64 string (no data: prefix).',
      required: true,
    }),
    content_type: Property.ShortText({
      displayName: 'Content Type',
      description:
        "The MIME type of the file, e.g. 'image/png' or 'application/pdf'.",
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Optional name for the file as it should appear after upload.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, record_id, attachment_field_id, file, content_type, filename } =
      propsValue;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://content.airtable.com/v0/${base_id}/${record_id}/${attachment_field_id}/uploadAttachment`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      body: {
        contentType: content_type,
        file,
        ...(filename ? { filename } : {}),
      },
    };

    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Airtable rejected the upload (permission). Ensure the token has data.records.write scope and access to this base.'
        );
      }
      if (status === 404) {
        throw new Error(
          `Base "${base_id}", record "${record_id}", or attachment field "${attachment_field_id}" was not found. Verify the IDs and that the field is a multiple-attachments column.`
        );
      }
      if (status === 422) {
        throw new Error(
          'Airtable rejected the attachment (422). Check the base64 content, content type, and that the field is an attachment column.'
        );
      }
      if (status === 429) {
        throw new Error('Airtable rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
