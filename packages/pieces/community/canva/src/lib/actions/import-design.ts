import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaApiCall } from '../common';
import { canvaAuth } from '../auth';

export const importDesignAction = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Imports an external file (e.g., PDF or PPTX) as an editable Canva design.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the imported design.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'File URL',
      description: 'A publicly accessible URL to the file to import (PDF, PPTX, etc.).',
      required: true,
    }),
    mime_type: Property.StaticDropdown({
      displayName: 'File Type',
      description: 'The MIME type of the file being imported.',
      required: true,
      defaultValue: 'application/pdf',
      options: {
        options: [
          { label: 'PDF', value: 'application/pdf' },
          {
            label: 'PowerPoint (PPTX)',
            value:
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { title, url, mime_type } = context.propsValue;
    const accessToken = context.auth.access_token;

    const importJob = await canvaApiCall<{ job: { id: string; status: string } }>({
      accessToken,
      method: HttpMethod.POST,
      path: '/imports',
      body: {
        title,
        url,
        mime_type,
      },
    });

    const jobId = importJob.job.id;
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await canvaApiCall<{
        job: { id: string; status: string; design?: unknown };
      }>({
        accessToken,
        method: HttpMethod.GET,
        path: `/imports/${jobId}`,
      });

      const { status } = statusResponse.job;

      if (status === 'success') {
        return statusResponse;
      }

      if (status === 'failed') {
        throw new Error(`Import job ${jobId} failed.`);
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error(`Import job ${jobId} timed out after ${maxAttempts} attempts.`);
  },
});
