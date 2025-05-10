import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common';
import { SMARTSUITE_API_URL, API_ENDPOINTS } from '../common/constants';

export const uploadFile = createAction({
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Uploads a file and attaches it to a record',
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
    record: smartsuiteCommon.record,
    field: Property.Dropdown({
      displayName: 'File Field',
      description: 'The file field to upload to',
      required: true,
      refreshers: ['solution', 'table'],
      options: async ({ auth, solution, table }) => {
        if (!auth || !solution || !table) {
          return {
            disabled: true,
            options: [],
          };
        }

        try {
          const fields = await smartsuiteCommon.getTableFields(
            auth as string,
            solution as string,
            table as string
          );

          return {
            disabled: false,
            options: fields
              .filter((field: any) => field.type === 'file')
              .map((field: any) => ({
                label: field.name,
                value: field.id,
              })),
          };
        } catch (error) {
          console.error('Error fetching file fields:', error);
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { solution, table, record, field, file } = propsValue;

    // First, we need to upload the file URL
    const formData = new FormData();
    const blob = new Blob([file.data], { type: 'application/octet-stream' });
    formData.append('file', blob, file.filename);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.ATTACH_FILE
          .replace('{solutionId}', solution as string)
          .replace('{appId}', table as string)
          .replace('{recordId}', record as string)
          .replace('{fieldId}', field as string)}`,
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Invalid file format or size: ${error.response?.body?.message || 'File may be too large or in an unsupported format'}`);
      }

      if (error.response?.status === 403) {
        throw new Error('You do not have permission to upload files to this record');
      }

      if (error.response?.status === 404) {
        throw new Error(`Record with ID ${record} not found or field ${field} is not a file field`);
      }

      if (error.response?.status === 413) {
        throw new Error('File is too large. SmartSuite has file size limits');
      }

      throw new Error(`Failed to upload file: ${error.message || 'Unknown error'}`);
    }
  },
});
