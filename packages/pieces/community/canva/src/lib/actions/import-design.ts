import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { canvaAuth } from '../auth';
import { CANVA_BASE_URL, pollJob } from '../common';

export const canvaImportDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import a design into Canva from a file or URL.',
  props: {
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'The title for the imported design.',
      required: false,
    }),
    import_type: Property.StaticDropdown({
      displayName: 'Import Type',
      required: true,
      defaultValue: 'url',
      options: {
        disabled: false,
        options: [
          { label: 'From URL', value: 'url' },
          { label: 'Upload File', value: 'file' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'The URL of the file to import (e.g. a publicly accessible PDF or PPTX).',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to import (PDF, PPTX, etc.).',
      required: false,
    }),
  },
  async run(context) {
    const { title, import_type, url, file } = context.propsValue;
    const accessToken = context.auth.access_token;

    let jobId: string;

    if (import_type === 'url') {
      if (!url) {
        throw new Error('URL is required when import type is "From URL".');
      }

      const body: Record<string, unknown> = { url };
      if (title) {
        body['title'] = title;
      }

      const response = await httpClient.sendRequest<{
        job: { id: string; status: string };
      }>({
        method: HttpMethod.POST,
        url: `${CANVA_BASE_URL}/imports`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        body,
      });

      jobId = response.body.job.id;
    } else {
      if (!file) {
        throw new Error('File is required when import type is "Upload File".');
      }

      const form = new FormData();

      if (title) {
        form.append('title', title);
      }

      form.append('file', file.data, {
        filename: file.filename || 'import',
        contentType: 'application/octet-stream',
      });

      const response = await httpClient.sendRequest<{
        job: { id: string; status: string };
      }>({
        method: HttpMethod.POST,
        url: `${CANVA_BASE_URL}/imports`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        headers: form.getHeaders(),
        body: form,
      });

      jobId = response.body.job.id;
    }

    const result = await pollJob<{
      job: { id: string; status: string; design?: unknown; error?: unknown };
    }>({
      accessToken,
      resourceUrl: `/imports/${jobId}`,
      isComplete: (body) =>
        body.job.status === 'success' || body.job.status === 'failed',
    });

    if (result.job.status === 'failed') {
      throw new Error(
        `Design import failed: ${JSON.stringify(result.job.error)}`
      );
    }

    return result.job;
  },
});
