import { airtableAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { AirtableTable } from './../common/models';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const airtableUploadFileToColumnAction = createAction({
  auth: airtableAuth,
  name: 'airtable_upload_file_to_column',
  displayName: 'Upload File to Column',
  description: 'Uploads a file to attachment type column.',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    attachment_column: Property.Dropdown({
      displayName: 'Attachment Column',
      required: true,
      refreshers: ['base', 'tableId'],
      options: async ({ auth, base, tableId }) => {
        if (!auth || !base || !tableId) {
          return {
            placeholder: 'Please select table first',
            options: [],
            disabled: true,
          };
        }

        const airtable: AirtableTable = await airtableCommon.fetchTable({
          token: auth as unknown as string,
          baseId: base as unknown as string,
          tableId: tableId as unknown as string,
        });

        return {
          disabled: false,

          options: airtable.fields
            .filter((field) => field.type === 'multipleAttachments')
            .map((field) => {
              return {
                label: field.name,
                value: field.id,
              };
            }),
        };
      },
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      required: true,
      description: 'The ID of the record to which you want to upload the file.',
    }),
    file: Property.File({
      displayName: 'File',
      required: true,
      description:
        'The file to be uploaded, which can be provided either as a public file URL or in Base64 encoded format.',
    }),
    file_content_type: Property.ShortText({
      displayName: 'File Content Type',
      required: true,
      description: `Specifies the MIME type of the file being uploaded (e.g., 'image/png', 'application/pdf').`,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'The name of the file as it should appear after upload.',
      required: false,
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
        token: context.auth,
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
