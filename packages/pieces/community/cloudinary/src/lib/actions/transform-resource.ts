import { createAction, Property } from '@activepieces/pieces-framework';

export const transformResource = createAction({
  name: 'transform_resource',
  displayName: 'Transform Resource',
  description: 'Apply transformations (resize, crop, watermark, etc.) to an asset and generate a new URL.',
  props: {
    publicId: Property.ShortText({
      displayName: 'Public ID',
      required: true,
      description: 'The public ID of the resource to transform.'
    }),
    transformation: Property.ShortText({
      displayName: 'Transformation String',
      required: true,
      description: 'Transformation string (e.g., w_400,h_300,c_fill).' 
    })
  },
  async run({ auth, propsValue }) {
    // TODO: Implement Cloudinary transformation logic
    return { success: false, message: 'Not implemented yet.' };
  },
}); 