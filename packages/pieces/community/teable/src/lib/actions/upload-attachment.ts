import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { TeableAuth } from '../auth';
import { makeClient, TeableCommon } from '../common';
import { TEABLE_CLOUD_URL } from '../common/constants';

export const uploadAttachmentAction = createAction({
  auth: TeableAuth,
  name: 'teable_upload_attachment',
  displayName: 'Upload Attachment',
  description: 'Uploads a file as an attachment to a field in a Teable record.',
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    field_id: Property.Dropdown({
      auth: TeableAuth,
      displayName: 'Attachment Field',
      description: 'The attachment field to upload the file to.',
      required: true,
      refreshers: ['table_id'],
      options: async ({ auth, table_id }) => {
        if (!auth || !table_id) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a table first.',
          };
        }
        const client = makeClient(auth.props);
        const fields = await client.listFields(table_id as string);
        const attachmentFields = fields.filter((f) => f.type === 'attachment');
        return {
          disabled: false,
          options: attachmentFields.map((f) => ({
            label: f.name,
            value: f.id,
          })),
        };
      },
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to attach the file to.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload. Accepts a URL or a binary file (base64).',
      required: true,
    }),
  },
  async run(context) {
    const { table_id, field_id, record_id } = context.propsValue;
    const file = context.propsValue.file as ApFile | string;
    const baseUrl = context.auth.props.baseUrl || TEABLE_CLOUD_URL;

    const form = new FormData();

    if (typeof file === 'string' && /^https?:\/\//i.test(file)) {
      form.append('fileUrl', file);
    } else {
      const apFile = file as ApFile;
      form.append('file', new Blob([new Uint8Array(apFile.data)]), apFile.filename);
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/table/${table_id}/record/${record_id}/${field_id}/uploadAttachment`,
      body: form,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.props.token,
      },
    });

    return result.body;
  },
});
