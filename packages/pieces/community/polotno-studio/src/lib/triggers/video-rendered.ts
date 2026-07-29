import { sampleRenders } from '../common/sample-data';
import { createRenderTrigger } from './webhook-factory';

export const videoRendered = createRenderTrigger({
  name: 'video_rendered',
  displayName: 'Video Rendered',
  description: 'Fires when a video render finishes successfully.',
  aiDescription:
    'Fires when a Polotno Studio video render completes successfully, providing the finished render including its video and thumbnail URLs. Use it to react to videos rendered anywhere in the project, including renders started outside this flow.',
  events: ['video.completed'],
  sampleData: sampleRenders.SAMPLE_VIDEO_RENDER,
});
