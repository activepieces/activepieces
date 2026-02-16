import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const exportDesignAction = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a design to PDF, PNG, JPG, GIF, PPTX, or MP4 format (async operation)',
  props: {
    designId: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to export',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The format to export the design as',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'GIF', value: 'gif' },
          { label: 'PowerPoint (PPTX)', value: 'pptx' },
          { label: 'Video (MP4)', value: 'mp4' },
        ],
      },
    }),
    quality: Property.Number({
      displayName: 'Quality (JPG only, 1-100)',
      description: 'JPEG compression quality. Only used for JPG exports. Higher = better quality, larger file.',
      required: false,
    }),
    pages: Property.Array({
      displayName: 'Pages',
      description: 'Specific page numbers to export (leave empty for all pages). First page is 1.',
      required: false,
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait for the export to complete before returning (recommended)',
      required: false,
      defaultValue: true,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'Maximum time to wait for export completion (default: 60 seconds)',
      required: false,
      defaultValue: 60,
    }),
  },
  async run(context) {
    const { designId, format, quality, pages, waitForCompletion, maxWaitTime } =
      context.propsValue;

    // Build format object per Canva API spec
    const formatObj: Record<string, unknown> = {
      type: format,
    };

    // JPG requires quality (integer 1-100)
    if (format === 'jpg' && quality) {
      formatObj.quality = Math.min(Math.max(Math.round(quality), 1), 100);
    }

    const body: Record<string, unknown> = {
      design_id: designId,
      format: formatObj,
    };

    if (pages && Array.isArray(pages) && pages.length > 0) {
      body.pages = pages.map((p) => Number(p));
    }

    // Step 1: Create the export job (POST /exports)
    const createResponse = await canvaApiCall<{
      job: { id: string; status: string };
    }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/exports',
      body,
    });

    const exportId = createResponse.job.id;

    // Step 2: If waitForCompletion, poll GET /exports/{exportId}
    if (waitForCompletion) {
      const maxAttempts = Math.ceil((maxWaitTime || 60) / 2);
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const result = await canvaApiCall<{
          job: { id: string; status: string; urls?: string[]; error?: { message: string } };
        }>({
          auth: context.auth,
          method: HttpMethod.GET,
          path: `/exports/${exportId}`,
        });

        if (result.job.status === 'success') {
          return {
            export_id: exportId,
            status: 'success',
            urls: result.job.urls,
            format,
          };
        }

        if (result.job.status === 'failed') {
          throw new Error(
            `Export failed: ${result.job.error?.message || 'Unknown error'}`
          );
        }

        // Wait 2 seconds before next poll
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      throw new Error('Export timed out after maximum attempts');
    }

    return {
      export_id: exportId,
      status: createResponse.job.status,
      message: 'Export job created. Use the export ID to check status later.',
      design_id: designId,
    };
  },
});
