import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiRequest, canvaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description:
    'Export a Canva design to PDF, PNG, JPG, GIF, MP4, or PPTX. Returns a job ID and, once complete, download URLs for the exported file(s).',
  props: {
    designId: canvaCommon.designId,
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The file format for the exported design.',
      required: true,
      options: {
        options: [
          { label: 'PDF (Print)', value: 'pdf' },
          { label: 'PDF (Standard)', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'GIF', value: 'gif' },
          { label: 'MP4 (Video)', value: 'mp4' },
          { label: 'PPTX (PowerPoint)', value: 'pptx' },
        ],
      },
    }),
    exportQuality: Property.StaticDropdown({
      displayName: 'Quality',
      description: 'Export quality for image/video formats.',
      required: false,
      options: {
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Pro', value: 'pro' },
        ],
      },
    }),
    pages: Property.Array({
      displayName: 'Pages',
      description:
        'List of 1-based page numbers to export. Leave empty to export all pages.',
      required: false,
    }),
  },
  async run(context) {
    const { designId, format, exportQuality, pages } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const exportFormat: Record<string, unknown> = { type: format };

    if (exportQuality) exportFormat['quality'] = exportQuality;
    if (pages && (pages as unknown[]).length > 0) {
      exportFormat['pages'] = (pages as unknown[]).map(Number);
    }

    const body: Record<string, unknown> = {
      design_id: designId,
      format: exportFormat,
    };

    const response = await canvaApiRequest({
      auth,
      method: HttpMethod.POST,
      path: '/exports',
      body,
    });

    return response;
  },
});
