import { SAMPLE_IMAGE_RENDER } from '../common/sample-data';
import { createRenderTrigger } from './webhook-factory';

export const imageRendered = createRenderTrigger({
  name: 'image_rendered',
  displayName: 'Image Rendered',
  description: 'Fires when an image render finishes successfully.',
  aiDescription:
    'Fires when a Polotno Studio image render completes successfully, providing the finished render including its download URL. Use it to react to images rendered anywhere in the project, including renders started outside this flow.',
  events: ['image.completed'],
  sampleData: SAMPLE_IMAGE_RENDER,
});
