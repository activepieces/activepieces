import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { canvaAuth } from '../..';
import { canvaCommon } from '../common';

export const importDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import an external file (PDF, PowerPoint, etc.) as a new Canva design.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title for the imported design.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to import (PDF, PPTX, AI, etc.).',
      required: true,
    }),
    mime_type: Property.StaticDropdown({
      displayName: 'File Type',
      description: 'The MIME type of the file being imported.',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'application/pdf' },
          { label: 'PowerPoint (PPTX)', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
          { label: 'Adobe Illustrator (AI)', value: 'application/illustrator' },
          { label: 'Adobe Photoshop (PSD)', value: 'image/vnd.adobe.photoshop' },
          { label: 'SVG', value: 'image/svg+xml' },
        ],
      },
    }),
  },
  async run(context) {
    const titleBase64 = Buffer.from(context.propsValue.title).toString('base64');
    const fileBuffer = Buffer.from(context.propsValue.file.base64, 'base64');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/imports',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'Content-Type': 'application/octet-stream',
        'Import-Metadata': JSON.stringify({
          title_base64: titleBase64,
          mime_type: context.propsValue.mime_type,
        }),
      },
      body: fileBuffer,
    });

    const jobId = response.body.job?.id;
    if (!jobId) {
      return response.body;
    }

    return await canvaCommon.pollJob(
      context.auth,
      `/imports/${jobId}`,
    );
  },
});
