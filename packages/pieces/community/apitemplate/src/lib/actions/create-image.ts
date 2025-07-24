import { createAction } from '@activepieces/pieces-framework';
import { apitemplateAuth } from '../common/auth';
import { APITemplateClient } from '../common/client';
import { templateIdProp, dataProp, overridesProp } from '../common/props';

export const createImage = createAction({
  auth: apitemplateAuth,
  name: 'create_image',
  displayName: 'Create Image',
  description: 'Generate an image from a pre-designed template with optional JSON overrides. Create templates at https://app.apitemplate.io',
  props: {
    template_id: templateIdProp,
    data: dataProp,
    overrides: overridesProp,
  },
  async run(context) {
    const { template_id, data, overrides } = context.propsValue;
    const client = new APITemplateClient(context.auth.apiKey);
    
    try {
      const result = await client.createImage(template_id, data, overrides);
      
      return {
        success: true,
        download_url: result.download_url,
        download_url_png: result.download_url_png,
        transaction_ref: result.transaction_ref,
        status: result.status,
        template_id: result.template_id,
        template_version: result.template_version,
        template_name: result.template_name,
      };
    } catch (error) {
      throw new Error(`Failed to create image: ${error}`);
    }
  },
});