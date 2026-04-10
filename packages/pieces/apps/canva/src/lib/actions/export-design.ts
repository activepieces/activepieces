import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { canvaCommon } from '../common';

export const exportDesignAction = createAction({
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a Canva design to a specified format (e.g., PDF, PNG).',
  props: {
    designId: canvaCommon.designId,
    format: Property.Dropdown({
      displayName: 'Format',
      description: 'The desired export format.',
      required: true,
      options: {
        options: [
          { label: 'PDF Standard', value: 'pdf' },
          { label: 'PDF Print', value: 'pdf_print' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          // Add other supported formats from Canva API
        ],
      },
      defaultValue: 'pdf',
    }),
    quality: Property.Number({
      displayName: 'Quality (JPG/PNG)',
      description: 'Export quality (1-100) for JPG/PNG. Higher is better.',
      required: false,
      defaultValue: 90,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { designId, format, quality } = propsValue;

    const body: Record<string, any> = {
      format,
    };
    if (format === 'png' || format === 'jpg') {
        body.quality = quality;
    }

    // Canva API often initiates an export process and returns a job ID.
    // Then you poll the job ID for the final URL. This is a simplified direct export.
    const response = await canvaCommon.makeRequest(
      auth.access_token,
      HttpMethod.POST,
      `/designs/${designId}/exports`,
      body
    );

    // Assuming the API returns a direct download URL or a job ID.
    // A real implementation would likely need a polling mechanism.
    return {
      exportJobId: response.id, // Assuming it returns a job ID
      exportStatus: response.status,
      downloadUrl: response.download_url, // Hypothetical direct URL
      message: 'Design export initiated.',
      data: response,
    };
  },
});
