import { createAction, Property } from '@activepieces/pieces-framework';
import { apitemplateAuth } from '../common/auth';
import { APITemplateClient } from '../common/client';
import { limitProp, offsetProp } from '../common/props';

export const listObjects = createAction({
  auth: apitemplateAuth,
  name: 'list_objects',
  displayName: 'List Generated Objects',
  description: 'List previously generated images and PDFs',
  props: {
    limit: limitProp,
    offset: offsetProp,
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Filter by specific template ID',
      required: false,
    }),
    group_name: Property.ShortText({
      displayName: 'Group Name',
      description: 'Filter by group name',
      required: false,
    }),
  },
  async run(context) {
    const { limit, offset, template_id, group_name } = context.propsValue;
    const client = new APITemplateClient(context.auth.apiKey);
    
    try {
      const params = {
        limit,
        offset,
        ...(template_id && { template_id }),
        ...(group_name && { group_name }),
      };
      
      const result = await client.listObjects(params);
      
      return {
        success: true,
        total_count: result.total_count,
        limit: result.limit,
        offset: result.offset,
        has_more: result.has_more,
        objects: result.objects.map((obj: any) => ({
          object_id: obj.object_id,
          template_id: obj.template_id,
          template_name: obj.template_name,
          template_version: obj.template_version,
          transaction_ref: obj.transaction_ref,
          created_at: obj.created_at,
          download_url: obj.download_url,
          download_url_png: obj.download_url_png,
          download_url_pdf: obj.download_url_pdf,
          status: obj.status,
          group_name: obj.group_name,
          export_type: obj.export_type,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to list objects: ${error}`);
    }
  },
});