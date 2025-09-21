import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const uploadFileToProjectAction = createAction({
  auth: teamworkAuth,
  name: 'upload_file_to_project',
  displayName: 'Upload File to Project',
  description: 'Upload a file to a Teamwork project.',
  props: {
    project_id: teamworkProps.project_id(true),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'The name of the file, including its extension (e.g., document.pdf).',
      required: true,
    }),
    fileDescription: Property.ShortText({
      displayName: 'File Description',
      description: 'A description for the uploaded file.',
      required: false,
    }),
    fileCategory: Property.ShortText({
      displayName: 'File Category',
      description: 'The category to assign the file to.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { project_id, file, fileName, fileDescription, fileCategory } = propsValue;

    return await teamworkClient.uploadFile(auth, project_id, file, fileName, fileDescription, fileCategory);
  },
});