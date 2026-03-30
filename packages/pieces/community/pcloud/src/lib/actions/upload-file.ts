import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudUploadFile = createAction({
  auth: pcloudAuth,
  name: 'upload_pcloud_file',
  displayName: 'Upload File',
  description: 'Upload a file to pCloud',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The folder ID to upload to (use 0 for root folder)',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The folder path to upload to (e.g., /folder1). Use folderId or path.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload (base64 or URL)',
      required: true,
    }),
    renameIfExists: Property.Checkbox({
      displayName: 'Rename if Exists',
      description: 'If set, the uploaded file will be renamed if a file with the same name exists',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const fileName = (fileData as any).filename || 'uploaded_file';
    
    // Prepare form data for multipart upload
    const formData = new FormData();
    
    // Add folder parameter
    if (context.propsValue.folderId) {
      formData.append('folderid', context.propsValue.folderId.toString());
    } else if (context.propsValue.path) {
      formData.append('path', context.propsValue.path);
    }
    
    // Add rename option
    if (context.propsValue.renameIfExists) {
      formData.append('renameifexists', '1');
    }
    
    // Add file
    const fileBuffer = Buffer.from(fileData.base64, 'base64');
    const blob = new Blob([fileBuffer], { type: (fileData as any).mimeType || 'application/octet-stream' });
    formData.append('file', blob, fileName);

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pcloud.com/uploadfile',
      body: formData,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
