import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../..';
import { joggAiWebhooks } from '../common/client';
import { joggAiOutputSchemas } from '../common/output-schemas';

const EVENTS = [
  'generated_video_failed',
  'generated_avatar_video_failed',
  'generated_template_video_failed',
  'generated_product_video_failed',
];

export const videoGenerationFailed = createTrigger({
  name: 'videoGenerationFailed',
  classification: 'READ',
  displayName: 'Video Generation Failed',
  description: 'Fires when an avatar, template or product video fails to generate',
  aiMetadata: {
    description:
      'Fires when a JoggAI avatar, template or product video render fails, delivering the video_id and the error code and message. Use to detect and handle failed renders. Duplicate deliveries of the same event_id are dropped.',
  },
  auth: joggAiAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  outputSchema: joggAiOutputSchemas.webhookEvent,
  sampleData: {
    event_id: 'evt_123456789',
    event: 'generated_video_failed',
    timestamp: 1732806631,
    data: {
      video_id: 'vd_123456',
      project_id: 'vd_123456',
      status: 'failed',
      error: {
        code: 50000,
        message: 'Video generation failed',
      },
    },
  },

  async onEnable(context) {
    await joggAiWebhooks.registerWebhook({
      apiKey: context.auth.secret_text,
      url: context.webhookUrl,
      events: EVENTS,
      store: context.store,
      storeKey: '_video_generation_failed_webhook',
    });
  },

  async onDisable(context) {
    await joggAiWebhooks.unregisterWebhook({
      apiKey: context.auth.secret_text,
      store: context.store,
      storeKey: '_video_generation_failed_webhook',
    });
  },

  async run(context) {
    return joggAiWebhooks.acceptEvent({
      payload: context.payload,
      events: EVENTS,
      store: context.store,
      storeKey: '_video_generation_failed_webhook',
      dedupeKey: '_video_generation_failed_webhook_seen_events',
    });
  },
});
