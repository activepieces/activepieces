import { createAction, Property } from '@activepieces/pieces-framework';
import { apitemplateAuth } from '../common/auth';
import { APITemplateClient } from '../common/client';

export const createPdfFromHtml = createAction({
  auth: apitemplateAuth,
  name: 'create_pdf_from_html',
  displayName: 'Create PDF from HTML',
  description: 'Generate a PDF document from raw HTML content. Note: May require creating a template first at https://app.apitemplate.io',
  props: {
    html: Property.LongText({
      displayName: 'HTML Content',
      description: 'Raw HTML content to convert to PDF',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Template Data',
      description: 'JSON data to replace variables in the HTML using Jinja2 syntax (e.g., {{ variable }})',
      required: false,
      defaultValue: {},
    }),
    css: Property.LongText({
      displayName: 'CSS Styles',
      description: 'Additional CSS styles to apply to the HTML',
      required: false,
    }),
    settings: Property.Json({
      displayName: 'PDF Settings',
      description: 'Advanced PDF generation settings (e.g., { "format": "A4", "orientation": "portrait" })',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const { html, data, css, settings } = context.propsValue;
    const client = new APITemplateClient(context.auth.apiKey);
    
    try {
      const requestData = {
        ...(data && Object.keys(data).length > 0 && data),
        ...(css && { css }),
        ...(settings && Object.keys(settings).length > 0 && settings),
      };
      
      const result = await client.createPdfFromHtml(html, requestData);
      
      return {
        success: true,
        download_url: result.download_url,
        download_url_pdf: result.download_url_pdf,
        transaction_ref: result.transaction_ref,
        status: result.status,
        expires_at: result.expires_at,
      };
    } catch (error) {
      throw new Error(`Failed to create PDF from HTML: ${error}`);
    }
  },
});