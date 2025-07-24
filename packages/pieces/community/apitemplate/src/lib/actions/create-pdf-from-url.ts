import { createAction, Property } from '@activepieces/pieces-framework';
import { apitemplateAuth } from '../common/auth';
import { APITemplateClient } from '../common/client';

export const createPdfFromUrl = createAction({
  auth: apitemplateAuth,
  name: 'create_pdf_from_url',
  displayName: 'Create PDF from URL (Custom API)',
  description: 'Generate a PDF from an external URL using custom API call. Note: Endpoint may vary by API configuration.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of the webpage to convert to PDF',
      required: true,
    }),
    settings: Property.Json({
      displayName: 'PDF Settings',
      description: 'PDF generation settings (e.g., { "format": "A4", "orientation": "portrait", "margin": { "top": "1cm" } })',
      required: false,
      defaultValue: {},
    }),
    wait_for_selector: Property.ShortText({
      displayName: 'Wait for Selector',
      description: 'CSS selector to wait for before generating PDF',
      required: false,
    }),
    wait_time: Property.Number({
      displayName: 'Wait Time (seconds)',
      description: 'Time to wait before generating PDF',
      required: false,
    }),
    viewport: Property.Json({
      displayName: 'Viewport Settings',
      description: 'Browser viewport settings (e.g., { "width": 1280, "height": 720 })',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const { url, settings, wait_for_selector, wait_time, viewport } = context.propsValue;
    const client = new APITemplateClient(context.auth.apiKey);
    
    try {
      const options = {
        ...(settings && Object.keys(settings).length > 0 && settings),
        ...(wait_for_selector && { wait_for_selector }),
        ...(wait_time && { wait_time }),
        ...(viewport && Object.keys(viewport).length > 0 && { viewport }),
      };
      
      const result = await client.createPdfFromUrl(url, options);
      
      return {
        success: true,
        download_url: result.download_url,
        download_url_pdf: result.download_url_pdf,
        transaction_ref: result.transaction_ref,
        status: result.status,
        expires_at: result.expires_at,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create PDF from URL: ${error}`,
        message: 'URL to PDF conversion may require specific API configuration or a different endpoint. Try using the Custom API Call action to test different endpoints.',
      };
    }
  },
});