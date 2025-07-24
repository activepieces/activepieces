import { createAction } from '@activepieces/pieces-framework';
import { apitemplateAuth } from '../common/auth';
import { APITemplateClient } from '../common/client';
import { templateIdProp, dataProp } from '../common/props';

export const createPdfFromTemplate = createAction({
  auth: apitemplateAuth,
  name: 'create_pdf_from_template',
  displayName: 'Create PDF from Template',
  description: 'Generate a PDF document from a pre-designed template. Create templates at https://app.apitemplate.io',
  props: {
    template_id: templateIdProp,
    data: dataProp,
  },
  async run(context) {
    const { template_id, data } = context.propsValue;
    const client = new APITemplateClient(context.auth.apiKey);
    
    try {
      const result = await client.createPdfFromTemplate(template_id, data);
      
      return {
        success: true,
        download_url: result.download_url,
        download_url_pdf: result.download_url_pdf,
        transaction_ref: result.transaction_ref,
        status: result.status,
        template_id: result.template_id,
        template_version: result.template_version,
        template_name: result.template_name,
      };
    } catch (error) {
      throw new Error(`Failed to create PDF from template: ${error}`);
    }
  },
});