import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

const SUPPORTED_FILE_TYPES = [
  'pdf', 'docx', 'pptx', 'txt', 'xlsx', 'mp3', 'mp4', 
  'html', 'csv', 'json', 'py', 'php', 'js', 'css', 
  'cs', 'swift', 'kt', 'xml', 'ts', 'png', 'jpg', 
  'jpeg', 'webp', 'gif'
];

export const fileUpload = createAction({
  auth: straicoAuth,
  name: 'file_upload',
  displayName: 'Upload File',
  description: 'Upload a file to Straico API for processing.',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
      description: 'The file to upload. Supported file types: pdf, docx, pptx, txt, xlsx, mp3, mp4, html, csv, json, py, php, js, css, cs, swift, kt, xml, ts, png, jpg, jpeg, webp, gif',
    }),
  },
  async run({ auth, propsValue }) {
    const fileExtension = propsValue.file.filename.split('.').pop()?.toLowerCase();
    if (!fileExtension || !SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      throw new Error(`File type not supported. Supported types are: ${SUPPORTED_FILE_TYPES.join(', ')}`);
    }

    const formData = new FormData();
    formData.append('file', new Blob([propsValue.file.data]), propsValue.file.filename);

    const response = await httpClient.sendRequest<{
      data: {
        url: string;
      };
      success: boolean;
    }>({
      url: `${baseUrlv0}/file/upload`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.body.data.url;
  },
}); 