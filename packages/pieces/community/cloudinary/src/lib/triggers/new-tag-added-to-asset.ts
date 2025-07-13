import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const newTagAddedToAsset = createTrigger({
  name: 'new_tag_added_to_asset',
  displayName: 'New Tag Added to Asset',
  description: 'Fires when a tag is added to an asset.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    public_id: 'sample_public_id',
    tag: 'sample_tag',
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