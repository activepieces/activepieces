import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../';
import { callCanvaApi } from '../common';

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
      description: 'JPEG compression quality (1-100).',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'Width in pixels for image exports.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'Height in pixels for image exports.',
      required: false,
    }),
  },
  async run(context) {
    const { design_id, format_type, quality, width, height } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    const format: Record<string, unknown> = { type: format_type };
    if (format_type === 'jpg' && quality) format['quality'] = quality;
    if (width) format['width'] = width;
    if (height) format['height'] = height;

    const body: Record<string, unknown> = {
      design_id,
      format,
    };

    const response = await callCanvaApi(HttpMethod.POST, 'exports', accessToken, body);
    return response.body;
  },
});
