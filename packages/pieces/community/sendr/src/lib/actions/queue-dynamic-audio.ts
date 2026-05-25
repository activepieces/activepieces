import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall, flattenObject } from '../common';

export const queueDynamicAudio = createAction({
  auth: sendrAuth,
  name: 'queue_dynamic_audio',
  displayName: 'Queue Dynamic Audio Generation',
  description: 'Queues a job to generate personalized audio by replacing a target word in a base audio file.',
  props: {
    audioUrl: Property.ShortText({
      displayName: 'Base Audio URL',
      description: 'Public URL of the base audio file to personalize.',
      required: true,
    }),
    targetWord: Property.ShortText({
      displayName: 'Target Word',
      description: 'The word to find and replace in the audio (e.g. "first_name" or "[NAME]").',
      required: true,
    }),
    replacementWord: Property.ShortText({
      displayName: 'Replacement Word',
      description: 'The word to insert in place of the target word (e.g. "Anna").',
      required: true,
    }),
    elevenlabsId: Property.ShortText({
      displayName: 'ElevenLabs Voice ID',
      description: 'Optional ElevenLabs voice ID for the generated audio.',
      required: false,
    }),
    languageCode: Property.ShortText({
      displayName: 'Language Code',
      description: 'Optional language code (e.g. "en-US", "de-DE").',
      required: false,
      defaultValue: 'en-US',
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'Optional callback URL to receive status updates when the audio job is done.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      audioUrl: context.propsValue.audioUrl,
      targetWord: context.propsValue.targetWord,
      replacementWord: context.propsValue.replacementWord,
    };
    if (context.propsValue.elevenlabsId) {
      body['elevenlabsId'] = context.propsValue.elevenlabsId;
    }
    if (context.propsValue.languageCode) {
      body['languageCode'] = context.propsValue.languageCode;
    }
    if (context.propsValue.webhookUrl) {
      body['webhookUrl'] = context.propsValue.webhookUrl;
    }
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/enrichment/dynamic-audio',
      body,
    });
    return flattenObject(response.body);
  },
});
