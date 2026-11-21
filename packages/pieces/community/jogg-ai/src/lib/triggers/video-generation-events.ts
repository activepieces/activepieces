import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../..';
import { joggAiWebhooks } from '../common/client';
import { joggAiOutputSchemas } from '../common/output-schemas';

const EVENTS = [
  'generated_video_success',
  'generated_avatar_video_success',
  'generated_template_video_success',
  'generated_product_video_success',
];

export const videoGeneratedSuccessfully = createTrigger({
  name: 'videoGeneratedSuccessfully',
  classification: 'READ',
  displayName: 'Video Generated Successfully',
  description: 'Fires when an avatar, template or product video is generated successfully',
  aiMetadata: {
    description:
      'Fires when a JoggAI avatar, template or product video finishes rendering, delivering the video_id (project_id is the same value), video URL and duration in decimal seconds. Use to react to a finished video without polling. Duplicate deliveries of the same event_id are dropped.',
  },
  auth: joggAiAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  outputSchema: joggAiOutputSchemas.webhookEvent,
  sampleData: {
    event_id: '02b29a4d98e74235830d5ebfc275b7d2',
    event: 'generated_video_success',
    timestamp: 1795004264,
    data: {
      duration: 2.933304,
      project_id: 'vd_83c2da0e0c544721a96366a0f8960dc4',
      video_id: 'vd_83c2da0e0c544721a96366a0f8960dc4',
      video_url: 'https://res-intl.jogg.ai/joggUserData/project/vd_83c2da0e0c544721a96366a0f8960dc4/output/output.mp4',
    },
  },

  async onEnable(context) {
    await joggAiWebhooks.registerWebhook({
      apiKey: context.auth.secret_text,
      url: context.webhookUrl,
      events: EVENTS,
      store: context.store,
      storeKey: '_video_generation_success_webhook',
    });
  },

  async onDisable(context) {
    await joggAiWebhooks.unregisterWebhook({
      apiKey: context.auth.secret_text,
      store: context.store,
      storeKey: '_video_generation_success_webhook',
    });
  },

  async run(context) {
    return joggAiWebhooks.acceptEvent({
      payload: context.payload,
      events: EVENTS,
      store: context.store,
      storeKey: '_video_generation_success_webhook',
      dedupeKey: '_video_generation_success_webhook_seen_events',
    });
  },
});
