import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { ChatAidAuth } from '../common/auth';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import FormData from 'form-data';

interface FileObject {
  file: ApFile;
}

export const addCustomSources = createAction({
  auth: ChatAidAuth,
  name: 'addCustomSources',
  displayName: 'Add Custom Sources',
  description: 'Upload one or more files as custom sources for training',
  props: {
    files: Property.Array({
      displayName: 'Files',
      description:
        'One or more files to upload (PDF, Word, Text, Markdown, HTML, Excel, CSV, PowerPoint, PNG, JPEG, GIF)',
      properties: { 
        file: Property.File({
          displayName: 'File',
          description: 'File to upload',
          required: true,
        }),
      },
      required: true,
    }),
    teamId: Property.ShortText({
      displayName: 'Team ID',
      description: 'Optional team ID (defaults to org-wide)',
      required: false,
    }),
  },
  async run(context) {
    const files = (context.propsValue.files as FileObject[]) || [];
    const teamId = context.propsValue.teamId as string | undefined;

    if (!files || files.length === 0) {
      throw new Error('At least one file is required');
    }

    const formData = new FormData();

    files.forEach((fileObj) => {
      const file = fileObj.file;
      const fileBuffer = file.base64 ? Buffer.from(file.base64, 'base64') : file.data;
      formData.append('files', fileBuffer, file.filename);
    });

    let path = '/external/sources/custom';
    if (teamId) {
      path += `?teamId=${encodeURIComponent(teamId)}`;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: context.auth.secret_text,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    };

    const response = await httpClient.sendRequest<never>(request);

    return response.body;
  },
});
