import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiCall, pollJob } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const canvaExportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a Canva design to a file format.',
  props: {
    design_id: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to export.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The file format to export the design as.',
      required: true,
      defaultValue: 'pdf',
      options: {
        disabled: false,
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'SVG', value: 'svg' },
          { label: 'GIF', value: 'gif' },
          { label: 'MP4 (Video)', value: 'mp4' },
          { label: 'PPTX', value: 'pptx' },
        ],
      },
    }),
  },
  async run(context) {
    const { design_id, format } = context.propsValue;
    const accessToken = context.auth.access_token;

    const response = await canvaApiCall<{ job: { id: string; status: string } }>({
      accessToken,
      method: HttpMethod.POST,
      resourceUrl: '/exports',
      body: {
        design_id,
        format: {
          type: format,
        },
      },
    });

    const jobId = response.job.id;

    const result = await pollJob<{
      job: { id: string; status: string; urls?: string[]; error?: unknown };
    }>({
      accessToken,
      resourceUrl: `/exports/${jobId}`,
      isComplete: (body) =>
        body.job.status === 'success' || body.job.status === 'failed',
    });

    if (result.job.status === 'failed') {
      throw new Error(
        `Design export failed: ${JSON.stringify(result.job.error)}`
      );
    }

    return result.job;
  },
});
