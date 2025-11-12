import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { ChatAidAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
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
      formData.append('files', file.data, file.filename);
    });

    let path = '/external/sources/custom';
    if (teamId) {
      path += `?teamId=${encodeURIComponent(teamId)}`;
    }

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      path,
      formData
    );

    return response;
  },
});
