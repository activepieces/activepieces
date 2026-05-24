import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const importDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import a file (PDF, PPTX, etc.) as a new Canva design.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to import (PDF, PPTX, DOCX, etc.).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'Title for the imported design.',
      required: true,
    }),
    mime_type: Property.StaticDropdown({
      displayName: 'File Type',
      description: 'MIME type of the file being imported.',
      required: true,
      defaultValue: 'application/pdf',
      options: {
        options: [
          { label: 'PDF', value: 'application/pdf' },
          { label: 'PowerPoint (PPTX)', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
          { label: 'Word (DOCX)', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { label: 'PNG image', value: 'image/png' },
          { label: 'JPEG image', value: 'image/jpeg' },
        ],
      },
    }),
  },
  async run(context) {
    const { file, title, mime_type } = context.propsValue;

    // Canva import: POST /rest/v1/imports
    // Content-Type: application/octet-stream
    // Import-Metadata: base64-encoded JSON with title_base64 + mime_type
    const metadata = Buffer.from(
      JSON.stringify({
        title_base64: Buffer.from(title).toString('base64'),
        mime_type,
      })
    ).toString('base64');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/imports',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Import-Metadata': metadata,
      },
      body: Buffer.from(file.base64, 'base64'),
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
