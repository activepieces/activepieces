import { airtableAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { AirtableTable } from './../common/models';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { uploadFileToColumnActionOutputSchema } from '../output-schemas';

export const airtableUploadFileToColumnAction = createAction({
  auth: airtableAuth,
  name: 'airtable_upload_file_to_column',
  classification: 'WRITE',
  displayName: 'Upload File to Column',
  description: 'Uploads a file to an attachment field of a record.',
  audience: 'human',
  outputSchema: uploadFileToColumnActionOutputSchema,
  aiMetadata: {
    description:
      'Uploads a file (given as a public URL or base64) into a multiple-attachments column on an existing record, identified by base, table, record ID and the attachment column. Use to attach files to a record. The file content type is required; each call adds an attachment, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    attachment_column: Property.Dropdown<string, true, typeof airtableAuth>({
      auth: airtableAuth,
      displayName: 'Attachment Column',
      description: 'Only attachment-type fields are listed.',
      required: true,
      refreshers: ['base', 'tableId'],
      options: async ({ auth, base, tableId }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your Airtable account first',
          };
        }
        if (!base) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a base first',
          };
        }
        if (!tableId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a table first',
          };
        }

        try {
          const airtable: AirtableTable = await airtableCommon.fetchTable({
            token: auth.secret_text,
            baseId: base as string,
            tableId: tableId as string,
          });

          return {
            disabled: false,
            options: airtable.fields
              .filter((field) => field.type === 'multipleAttachments')
              .map((field) => ({
                label: field.name,
                value: field.id,
              })),
          };
        } catch (e) {
          console.debug(e);
          return {
            disabled: true,
            options: [],
            placeholder: `Could not load. Check the token's scopes.`,
          };
        }
      },
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      required: true,
      description:
        'Starts with rec. Copy it from the record URL or an earlier step.',
      placeholder: 'recXXXXXXXXXXXXXX',
    }),
    file: Property.File({
      displayName: 'File',
      required: true,
      description: 'A file from an earlier step or a public URL.',
    }),
    file_content_type: Property.ShortText({
      displayName: 'File Content Type',
      required: true,
      description: 'MIME type of the file.',
      placeholder: 'image/png',
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: `Name shown in Airtable. Empty: the uploaded file's own name.`,
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const baseId = context.propsValue.base;
    const recordId = context.propsValue.recordId;
    const fieldId = context.propsValue.attachment_column;
    const fileInput = context.propsValue.file;

    const fileName = context.propsValue.filename ?? fileInput.filename;
    const fileBase64Data = fileInput.base64;
    const fileContentType = context.propsValue.file_content_type;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://content.airtable.com/v0/${baseId}/${recordId}/${fieldId}/uploadAttachment`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body: {
        contentType: fileContentType,
        file: fileBase64Data,
        filename: fileName,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
