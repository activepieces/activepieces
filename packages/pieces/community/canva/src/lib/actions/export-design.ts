import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall, pollExportJob } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { exportFormatDropdown, exportQualityDropdown } from '../common';

export const exportDesignAction = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a design to PDF, PNG, JPG, GIF, PPTX, or MP4 format',
  props: {
    designId: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to export',
      required: true,
    }),
    format: exportFormatDropdown,
    quality: exportQualityDropdown,
    pages: Property.Array({
      displayName: 'Pages',
      description: 'Specific page numbers to export (leave empty for all pages)',
      required: false,
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait for the export to complete before returning',
      required: false,
      defaultValue: true,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'Maximum time to wait for export completion',
      required: false,
      defaultValue: 60,
    }),
  },
  async run(context) {
    const { designId, format, quality, pages, waitForCompletion, maxWaitTime } =
      context.propsValue;

    // Build format object per Canva API spec (nested object with type)
    const formatObj: Record<string, unknown> = {
      type: format,
    };

    if (quality) {
      formatObj.export_quality = quality;
    }

    if (pages && Array.isArray(pages) && pages.length > 0) {
      formatObj.pages = pages.map((p) => Number(p));
    }

    const body: Record<string, unknown> = {
      design_id: designId,
      format: formatObj,
    };

    // Endpoint is POST /v1/exports (not /designs/{id}/exports)
    const createResponse = await canvaApiCall<{
      job: { id: string; status: string; urls?: string[] };
    }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/exports',
      body,
    });

    const jobId = createResponse.job.id;

    if (waitForCompletion) {
      const maxAttempts = Math.ceil((maxWaitTime || 60) / 2);
      const result = await pollExportJob(
        context.auth,
        jobId,
        maxAttempts,
        2000
      );

      return {
        job_id: jobId,
        status: result.job.status,
        urls: result.job.urls,
        format,
        success: true,
      };
    }

    return {
      job_id: jobId,
      status: createResponse.job.status,
      message: 'Export job created. Use the job ID to check status later.',
      design_id: designId,
    };
  },
});
