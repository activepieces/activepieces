import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const newResource = createTrigger({
  name: 'new_resource',
  displayName: 'New Resource',
  description: 'Fires when a new image, video, or file is uploaded to a specific folder or account.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    public_id: 'sample_public_id',
    resource_type: 'image',
    url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
  },
  async onEnable() {
    // TODO: Implement Cloudinary trigger enable logic
  },
  async onDisable() {
    // TODO: Implement Cloudinary trigger disable logic
  },
  async run() {
    // TODO: Implement Cloudinary polling logic
    return [];
  },
}); 