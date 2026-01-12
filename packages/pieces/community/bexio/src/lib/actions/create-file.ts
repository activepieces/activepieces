import { createAction, Property } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { bexioCommon } from '../common/index';
import FormData from 'form-data';

export const createFileAction = createAction({
  auth: bexioAuth,
  name: 'create_file',
  displayName: 'Create File',
  description: 'Upload a new file to Bexio',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
  },
  async run(context) {
    const file = context.propsValue['file'];
    
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    // Use Buffer directly - form-data package handles it correctly
    formData.append('file', file.data, file.filename);

    // Use httpClient directly for multipart/form-data since BexioClient uses JSON
    const response = await httpClient.sendRequest<Array<{
      id: number;
      uuid: string;
      name: string;
      size_in_bytes: number;
      extension: string;
      mime_type: string;
      uploader_email: string | null;
      user_id: number;
      is_archived: boolean;
      source_id: number;
      source_type: string | null;
      is_referenced: boolean;
      created_at: string;
    }>>({
      url: `${bexioCommon.baseUrl}/3.0/files`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        Accept: 'application/json',
        // Don't set Content-Type manually - formData.getHeaders() will set it with boundary for multipart/form-data
        ...formData.getHeaders(),
      },
      body: formData,
    });

    return response.body;
  },
});

