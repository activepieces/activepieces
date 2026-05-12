import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaApiCall } from '../common';
import { canvaAuth } from '../auth';

export const exportDesignAction = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Exports a Canva design to a file format (PDF, PNG, JPG, etc.).',
  props: {
    design_id: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to export.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The file format to export the design to.',
      required: true,
      defaultValue: 'pdf',
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'GIF', value: 'gif' },
          { label: 'PPTX', value: 'pptx' },
          { label: 'MP4', value: 'mp4' },
          { label: 'SVG', value: 'svg' },
        ],
      },
    }),
  },
  async run(context) {
    const { design_id, format } = context.propsValue;
    const accessToken = context.auth.access_token;

    const exportJob = await canvaApiCall<{ job: { id: string; status: string } }>({
      accessToken,
      method: HttpMethod.POST,
      path: '/exports',
      body: {
        design_id,
        format: { type: format },
      },
    });

    const jobId = exportJob.job.id;
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await canvaApiCall<{
        job: { id: string; status: string; urls?: string[] };
      }>({
        accessToken,
        method: HttpMethod.GET,
        path: `/exports/${jobId}`,
      });

      const { status } = statusResponse.job;

      if (status === 'success') {
        return statusResponse;
      }

      if (status === 'failed') {
        throw new Error(`Export job ${jobId} failed.`);
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error(`Export job ${jobId} timed out after ${maxAttempts} attempts.`);
  },
});
