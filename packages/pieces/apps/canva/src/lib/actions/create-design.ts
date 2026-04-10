import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { canvaCommon } from '../common';

export const createDesignAction = createAction({
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new design from a template or scratch.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new design.',
      required: true,
    }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'Optional. The ID of the Canva template to use.',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'The width of the design canvas in pixels.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'The height of the design canvas in pixels.',
      required: false,
    }),
    folderId: { ...canvaCommon.folderId, required: false }, // Optional for creation
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { title, templateId, width, height, folderId } = propsValue;

    const body: Record<string, any> = {
      title,
    };

    if (templateId) {
      body.template_id = templateId;
    } else if (width && height) {
      body.dimensions = { width, height };
    } else {
        throw new Error('Either Template ID or custom dimensions (Width and Height) must be provided.');
    }

    if (folderId) {
        body.folder_id = folderId;
    }

    const response = await canvaCommon.makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/designs',
      body
    );

    return {
      designId: response.id,
      designUrl: response.edit_url,
      message: 'Design created successfully.',
      data: response,
    };
  },
});
