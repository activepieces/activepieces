import { SAMPLE_FAILED_RENDER } from '../common/sample-data';
import { createRenderTrigger } from './webhook-factory';

export const renderFailed = createRenderTrigger({
  name: 'render_failed',
  displayName: 'Render Failed',
  description: 'Fires when an image or video render fails.',
  aiDescription:
    'Fires when a Polotno Studio image or video render fails, providing the failed render including its error code and message. Use it to alert on or retry broken renders.',
  events: ['image.failed', 'video.failed'],
  sampleData: SAMPLE_FAILED_RENDER,
});
