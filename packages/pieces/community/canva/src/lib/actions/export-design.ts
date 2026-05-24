import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Start an export job for a Canva design and return the download URL(s) once ready.',
  props: {
    design_id: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to export.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      required: true,
      defaultValue: 'pdf',
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'SVG', value: 'svg' },
          { label: 'PPTX', value: 'pptx' },
          { label: 'MP4', value: 'mp4' },
          { label: 'GIF', value: 'gif' },
        ],
      },
    }),
  },
  async run(context) {
    const { design_id, format } = context.propsValue;

    const createResponse = await httpClient.sendRequest<{ job: { id: string; status: string } }>({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/exports',
      body: { design_id, format },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const jobId = createResponse.body.job.id;

    // Poll until the export job is complete (max 30 attempts × 2 s = 60 s)
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await httpClient.sendRequest<{
        job: { id: string; status: string; urls?: string[] };
      }>({
        method: HttpMethod.GET,
        url: `https://api.canva.com/rest/v1/exports/${jobId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });

      const job = statusResponse.body.job;
      if (job.status === 'success') return job;
      if (job.status === 'failed') throw new Error(`Export job ${jobId} failed.`);
    }

    throw new Error(`Export job ${jobId} timed out after 60 seconds.`);
  },
});
