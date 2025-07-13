import { createAction, Property } from '@activepieces/pieces-framework';

export const deleteResource = createAction({
  name: 'delete_resource',
  displayName: 'Delete Resource',
  description: 'Permanently delete an image, video, or file from Cloudinary.',
  props: {
    publicId: Property.ShortText({
      displayName: 'Public ID',
      required: true,
      description: 'The public ID of the resource to delete.'
    })
  },
  async run({ auth, propsValue }) {
    // TODO: Implement Cloudinary delete logic
    return { success: false, message: 'Not implemented yet.' };
  },
}); 