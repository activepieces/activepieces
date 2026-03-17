import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flipandoAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const runApp = createAction({
  auth: flipandoAuth,
  name: 'runApp',
  displayName: 'Run App',
  description:
    'Triggers the execution of a specific Flipando application by ID, initiating a background job for application completion.',
  props: {
    application_id: Property.Number({
      displayName: 'Application ID',
      description: 'ID of the application to be completed.',
      required: true,
    }),
    inputs_data: Property.LongText({
      displayName: 'Inputs Data',
      description:
        'JSON string of key-value pairs for application input variables.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description:
        'File to be uploaded, if the application requires documents. Supports PDF, DOCX, images, and other document formats.',
      required: false,
    }),
    file_description: Property.ShortText({
      displayName: 'File Description',
      description:
        'Description of the file being uploaded. Required when uploading a file.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const applicationId = context.propsValue.application_id;
    const inputsData = context.propsValue.inputs_data;
    const file = context.propsValue.file;
    const fileDescription = context.propsValue.file_description;

    // Validate that file_description is provided if file is uploaded
    if (file && !fileDescription) {
      throw new Error(
        'file_description is required when uploading a file.'
      );
    }

    const formData = new FormData();
    if (inputsData) {
      formData.append('inputs_data', inputsData);
    }
    if (file) {
      const blob = new Blob([file.data as unknown as ArrayBuffer], { type: 'application/octet-stream' });
      formData.append('file', blob, file.filename);
      if (fileDescription) {
        formData.append('file_description', fileDescription);
      }
    }

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/integrations/applications/${applicationId}/completion`,
      undefined,
      formData
    );
  },
});
