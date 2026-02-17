import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../';

export const canvaImportDesign = createAction({
  auth: canvaAuth,
  name: 'import_canva_design',
  description: 'Import a design into Canva from a file or URL',
  displayName: 'Import Design',
  props: {
    import_source: Property.StaticDropdown({
      displayName: 'Import Source',
      description: 'Choose whether to import from a file or a URL.',
      required: true,
      options: {
        options: [
          { label: 'File Upload', value: 'file' },
          { label: 'URL', value: 'url' },
        ],
      },
      defaultValue: 'url',
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'The URL of the file to import. Required when import source is URL.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description:
        'The file to import. Required when import source is File Upload. Supported formats: PDF, PPT, PPTX, AI, EPS.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the imported design (1-255 characters).',
      required: false,
    }),
  },
  async run(context) {
    const { import_source, url, file, title } = context.propsValue;

    let jobId: string;

    if (import_source === 'url') {
      const body: Record<string, unknown> = {
        url: url,
      };
      if (title) {
        body.title = title;
      }

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.canva.com/rest/v1/url-imports',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });
      jobId = response.body.job.id;
    } else {
      if (!file) {
        throw new Error('File is required when import source is File Upload.');
      }
      const fileBuffer = Buffer.from(file.base64, 'base64');

      const metadata: Record<string, unknown> = {};
      if (title) {
        metadata.title_base64 = Buffer.from(title).toString('base64');
      }

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.canva.com/rest/v1/imports',
        body: fileBuffer,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Import-Metadata': JSON.stringify(metadata),
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });
      jobId = response.body.job.id;
    }

    // Poll for job completion
    const pollUrl =
      import_source === 'url'
        ? `https://api.canva.com/rest/v1/url-imports/${jobId}`
        : `https://api.canva.com/rest/v1/imports/${jobId}`;

    let job: Record<string, unknown> = { status: 'in_progress' };
    while (job.status === 'in_progress') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: pollUrl,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });
      job = statusResponse.body.job;
    }

    return job;
  },
});
