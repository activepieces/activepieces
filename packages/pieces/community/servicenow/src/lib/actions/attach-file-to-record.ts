import { createAction, Property } from '@activepieces/pieces-framework';
import { servicenowAuth } from '../../auth';
import { callServiceNowApi, getServiceNowTables, ServiceNowApiResponse, ServiceNowRecord } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const attachFileToRecord = createAction({
  auth: servicenowAuth,
  name: 'attach_file_to_record',
  displayName: 'Attach File to Record',
  description: 'Upload a file and attach it to a record in a table',
  props: {
    table: Property.Dropdown({
      displayName: 'Table',
      description: 'Select the ServiceNow table',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const tables = await getServiceNowTables(auth);
          return {
            disabled: false,
            options: tables.map(table => ({
              label: table,
              value: table,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading tables'
          };
        }
      },
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID (sys_id)',
      description: 'The sys_id of the record to attach the file to',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the file to attach',
      required: true,
    }),
    fileContent: Property.LongText({
      displayName: 'File Content',
      description: 'Base64 encoded file content or file data',
      required: true,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      description: 'MIME type of the file (e.g., text/plain, application/pdf)',
      required: false,
      defaultValue: 'text/plain',
    }),
  },
  async run(context) {
    const { table, recordId, fileName, fileContent, contentType } = context.propsValue;
    const auth = context.auth as any;

    try {
      // First, get the record to ensure it exists
      await callServiceNowApi<ServiceNowApiResponse<ServiceNowRecord>>(
        HttpMethod.GET,
        auth,
        `/table/${table}/${recordId}`
      );

      // Create the attachment record
      const attachmentData = {
        table_name: table,
        table_sys_id: recordId,
        file_name: fileName,
        content_type: contentType || 'text/plain',
        size_bytes: Buffer.byteLength(fileContent, 'utf8'),
      };

      const response = await callServiceNowApi<ServiceNowApiResponse<ServiceNowRecord>>(
        HttpMethod.POST,
        auth,
        '/sys_attachment',
        attachmentData
      );

      const attachmentId = response.result.sys_id;

      // Upload the file content
      const uploadResponse = await fetch(`${auth.instanceUrl}/api/now/attachment/file?table_name=${table}&table_sys_id=${recordId}&file_name=${fileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
          'Content-Type': contentType || 'text/plain',
        },
        body: fileContent,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      return {
        attachment_id: attachmentId,
        file_name: fileName,
        record_id: recordId,
        table_name: table,
        status: 'success',
      };
    } catch (error) {
      console.error('Error attaching file to record:', error);
      throw error;
    }
  },
});
