import { createAction, Property } from '@activepieces/pieces-framework';
import { apitemplateAuth } from '../common/auth';
import { APITemplateClient } from '../common/client';

export const createPdfAdvanced = createAction({
  auth: apitemplateAuth,
  name: 'create_pdf_advanced',
  displayName: 'Create PDF (Advanced)',
  description: 'Generate a PDF with custom filename, CMYK/color settings, resolution, and template options',
  props: {
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to use',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Template Data',
      description: 'JSON data to fill the template variables',
      required: true,
      defaultValue: {},
    }),
    settings: Property.Json({
      displayName: 'Advanced Settings',
      description: 'Advanced PDF generation settings (e.g., { "filename": "my-pdf.pdf", "format": "A4", "orientation": "portrait", "resolution": 300, "color_mode": "rgb" })',
      required: false,
      defaultValue: {
        format: 'A4',
        orientation: 'portrait',
        resolution: 300,
        color_mode: 'rgb'
      },
    }),
    expiration: Property.Number({
      displayName: 'Expiration (hours)',
      description: 'Hours until the PDF expires (default: 24)',
      required: false,
      defaultValue: 24,
    }),
    cloud_storage: Property.Checkbox({
      displayName: 'Store in Cloud',
      description: 'Store the PDF in APITemplate cloud storage',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { template_id, data, settings, expiration, cloud_storage } = context.propsValue;
    const client = new APITemplateClient(context.auth.apiKey);
    
    try {
      const options = {
        template_id,
        data,
        ...(settings && Object.keys(settings).length > 0 && { settings }),
        ...(expiration && { expiration_in_hours: expiration }),
        ...(cloud_storage !== undefined && { cloud_storage }),
      };
      
      const result = await client.createPdfAdvanced(options);
      
      return {
        success: true,
        download_url: result.download_url,
        download_url_pdf: result.download_url_pdf,
        transaction_ref: result.transaction_ref,
        status: result.status,
        expires_at: result.expires_at,
        filename: result.filename,
        template_id: result.template_id,
        template_version: result.template_version,
      };
    } catch (error) {
      throw new Error(`Failed to create advanced PDF: ${error}`);
    }
  },
});