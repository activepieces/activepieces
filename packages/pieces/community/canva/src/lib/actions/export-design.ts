import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../';

export const canvaExportDesign = createAction({
  auth: canvaAuth,
  name: 'export_canva_design',
  description: 'Export a Canva design to a file format',
  displayName: 'Export Design',
  props: {
    design_id: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to export.',
      required: true,
    }),
    export_format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The file format to export the design as.',
      required: true,
      options: {
        options: [
          { label: 'PDF (Standard)', value: 'pdf_standard' },
          { label: 'PDF (Print)', value: 'pdf_print' },
          { label: 'JPG', value: 'jpg' },
          { label: 'PNG', value: 'png' },
          { label: 'GIF', value: 'gif' },
          { label: 'PowerPoint (PPTX)', value: 'pptx' },
          { label: 'MP4', value: 'mp4' },
        ],
      },
      defaultValue: 'pdf_standard',
    }),
    quality: Property.Number({
      displayName: 'Quality',
      description:
        'The quality of the exported file (1-100). Only applies to JPG format.',
      required: false,
    }),
    pages: Property.Array({
      displayName: 'Page Numbers',
      description:
        'Specific page numbers to export (1-based). Leave empty to export all pages.',
      required: false,
    }),
  },
  async run(context) {
    const { design_id, export_format, quality, pages } = context.propsValue;

    const formatParts = export_format.split('_');
    const type = formatParts[0];

    const exportFormat: Record<string, unknown> = { type };

    if (type === 'pdf' && formatParts.length > 1) {
      exportFormat.size = formatParts[1];
    }

    if (type === 'jpg' && quality) {
      exportFormat.quality = quality;
    }

    if (pages && pages.length > 0) {
      exportFormat.pages = pages.map((p: unknown) => Number(p));
    }

    const body: Record<string, unknown> = {
      design_id,
      format: exportFormat,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/exports',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const jobId = response.body.job.id;

    // Poll for job completion
    let job = response.body.job;
    while (job.status === 'in_progress') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.canva.com/rest/v1/exports/${jobId}`,
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
