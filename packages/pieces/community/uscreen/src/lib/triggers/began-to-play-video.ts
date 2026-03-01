import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { uscreenAuth } from '../common/auth';
import { uscreenProps } from '../common/props';

const sampleData = {
  event: 'video_play',
  title: 'How to Build an API',
  id: 987654,
  chapter_id: 123456,
  name: 'John Doe',
  email: 'john.doe@example.com',
};

export const beganToPlayVideo = createTrigger({
  auth: uscreenAuth,
  name: 'began_to_play_video',
  displayName: 'Began to Play Video',
  description: 'Triggers when a user plays a video for the first time.',
  props: {
    setupInstructions: uscreenProps.webhookInstructions(),
  },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    //Empty
  },

  async onDisable(context) {
    //Empty
  },

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;

    if (payload.event !== 'video_play') {
      return [];
    }

    return [payload];
  },

  async test(context) {
    return [sampleData];
  },
});
