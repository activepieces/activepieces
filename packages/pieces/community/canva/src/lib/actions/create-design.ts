import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new design in Canva',
  props: {
    designType: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Type of design to create',
      required: true,
      options: {
        options: [
          { label: 'Instagram Post', value: 'instagram-post' },
          { label: 'Instagram Story', value: 'instagram-story' },
          { label: 'Facebook Post', value: 'facebook-post' },
          { label: 'Presentation', value: 'presentation' },
          { label: 'Poster', value: 'poster' },
          { label: 'Flyer', value: 'flyer' },
          { label: 'Business Card', value: 'business-card' },
          { label: 'Logo', value: 'logo' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'Title for the new design',
      required: true,
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'Width in pixels (required for custom designs)',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'Height in pixels (required for custom designs)',
      required: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'ID of the folder to create the design in',
      required: false,
    }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'ID of a template to use as a starting point',
      required: false,
    }),
  },
  async run(context) {
    const { designType, title, width, height, folderId, templateId } = context.propsValue;
    
    try {
      const designData: any = {
        design_type: designType,
        title: title,
      };

      if (designType === 'custom') {
        if (!width || !height) {
          throw new Error('Width and height are required for custom designs');
        }
        designData.width = width;
        designData.height = height;
      }

      if (folderId) {
        designData.folder_id = folderId;
      }

      if (templateId) {
        designData.template_id = templateId;
      }

      const result = await canvaCommon.makeRequest(
        context.auth,
        'POST',
        '/designs',
        designData
      );

      return {
        success: true,
        design: result.design,
        editUrl: result.design.urls.edit_url,
        viewUrl: result.design.urls.view_url,
        message: `Design "${title}" created successfully`,
      };
    } catch (error:any) {
      throw new Error(`Failed to create design: ${error.message}`);
    }
  },
});