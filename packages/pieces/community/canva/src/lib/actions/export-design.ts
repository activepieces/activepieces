import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';

export const canvaExportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a design from Canva to a downloadable file',
  props: {
    designId: Property.ShortText({
      displayName: 'Design ID',
      description: 'ID of the design to export',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'Format to export the design as',
      required: true,
      options: {
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'PDF (Standard)', value: 'pdf_standard' },
          { label: 'PDF (Print)', value: 'pdf_print' },
          { label: 'MP4 (Video)', value: 'mp4' },
          { label: 'GIF', value: 'gif' },
          { label: 'PPTX (PowerPoint)', value: 'pptx' },
        ],
      },
    }),
    pages: Property.Array({
      displayName: 'Page Numbers',
      description: 'Specific page numbers to export (leave empty for all)',
      required: false,
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description: 'Export quality (for images)',
      required: false,
      options: {
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Pro', value: 'pro' },
        ],
      },
    }),
  },
  async run(context) {
    const { designId, format, pages, quality } = context.propsValue;
    const accessToken = context.auth.access_token;

    const exportFormat: Record<string, unknown> = { type: format };

    if (quality) {
      exportFormat['quality'] = quality;
    }

    const body: Record<string, unknown> = {
      design_id: designId,
      format: exportFormat,
    };

    if (pages && pages.length > 0) {
      body['pages'] = pages.map((p) => parseInt(String(p), 10));
    }

    // Start export job
    const startResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/exports',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const exportId = startResponse.body.job.id;

    // Poll for completion
    let status = 'in_progress';
    let result = null;
    const maxAttempts = 60;
    let attempts = 0;

    while (status === 'in_progress' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;

      const statusResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.canva.com/rest/v1/exports/${exportId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      status = statusResponse.body.job.status;
      if (status === 'success') {
        result = statusResponse.body.job;
      } else if (status === 'failed') {
        throw new Error(`Export failed: ${JSON.stringify(statusResponse.body.job.error)}`);
      }
    }

    if (status === 'in_progress') {
      throw new Error('Export timed out');
    }

    return result;
  },
});
