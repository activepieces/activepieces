import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../..';
import { canvaCommon } from '../common';

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a Canva design as PDF, JPG, PNG, GIF, PPTX, or MP4.',
  props: {
    design_id: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to export.',
      required: true,
    }),
    format_type: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The file format to export the design as.',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'JPG', value: 'jpg' },
          { label: 'PNG', value: 'png' },
          { label: 'GIF', value: 'gif' },
          { label: 'PowerPoint (PPTX)', value: 'pptx' },
          { label: 'MP4 Video', value: 'mp4' },
        ],
      },
    }),
    quality: Property.Number({
      displayName: 'Quality (JPG only)',
      description: 'JPEG quality (1-100). Only applicable for JPG exports.',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'Export width in pixels (for JPG/PNG). Optional.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'Export height in pixels (for JPG/PNG). Optional.',
      required: false,
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Comma-separated page numbers to export (e.g., "1,2,3"). Leave empty for all pages.',
      required: false,
    }),
  },
  async run(context) {
    const format: Record<string, unknown> = {
      type: context.propsValue.format_type,
    };

    if (context.propsValue.format_type === 'jpg' && context.propsValue.quality) {
      format['quality'] = context.propsValue.quality;
    }
    if (context.propsValue.width) {
      format['width'] = context.propsValue.width;
    }
    if (context.propsValue.height) {
      format['height'] = context.propsValue.height;
    }

    const body: Record<string, unknown> = {
      design_id: context.propsValue.design_id,
      format,
    };

    if (context.propsValue.pages) {
      body['pages'] = context.propsValue.pages.split(',').map((p: string) => parseInt(p.trim(), 10));
    }

    const response = await canvaCommon.makeRequest<{ job: { id: string; status: string } }>(
      context.auth,
      HttpMethod.POST,
      '/exports',
      body,
    );

    const jobId = response.job?.id;
    if (!jobId) {
      return response;
    }

    return await canvaCommon.pollJob(
      context.auth,
      `/exports/${jobId}`,
    );
  },
});
