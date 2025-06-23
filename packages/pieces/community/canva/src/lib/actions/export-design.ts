import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a design from Canva in various formats',
  props: {
    designId: Property.ShortText({
      displayName: 'Design ID',
      description: 'ID of the design to export',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'Format to export the design in',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'SVG', value: 'svg' },
          { label: 'GIF', value: 'gif' },
          { label: 'MP4', value: 'mp4' },
        ],
      },
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description: 'Export quality (for raster formats)',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
      defaultValue: 'high',
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Comma-separated page numbers to export (e.g., "1,3,5" or "all")',
      required: false,
      defaultValue: 'all',
    }),
    includeBleed: Property.Checkbox({
      displayName: 'Include Bleed',
      description: 'Include bleed area in export (for print formats)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { designId, format, quality, pages, includeBleed } = context.propsValue;
    
    try {
      const exportData = {
        format: format,
        quality: quality,
        pages: pages === 'all' ? undefined : pages.split(',').map((p:any) => parseInt(p.trim())),
        include_bleed: includeBleed,
      };

      //start the export
      const exportJob = await canvaCommon.makeRequest(
        context.auth,
        'POST',
        `/designs/${designId}/export`,
        exportData
      );

      let exportResult;
      let attempts = 0;
      const maxAttempts = 30; 

      do {
        await new Promise(resolve => setTimeout(resolve, 10000)); 
        exportResult = await canvaCommon.makeRequest(
          context.auth,
          'GET',
          `/designs/${designId}/export/${exportJob.job.id}`
        );
        attempts++;
      } while (exportResult.job.status === 'in_progress' && attempts < maxAttempts);

      if (exportResult.job.status === 'success') {
        return {
          success: true,
          downloadUrl: exportResult.job.urls.download_url,
          format: format,
          fileSize: exportResult.job.file_size,
          message: `Design exported successfully as ${format.toUpperCase()}`,
        };
      } else {
        throw new Error(`Export failed with status: ${exportResult.job.status}`);
      }
    } catch (error:any) {
      throw new Error(`Failed to export design: ${error.message}`);
    }
  },
});
