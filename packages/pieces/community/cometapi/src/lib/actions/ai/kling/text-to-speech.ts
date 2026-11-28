import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingTextToSpeechOutputSchema } from '../../../output-schemas';

export const klingTextToSpeechAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_text_to_speech',
  outputSchema: cometapiKlingTextToSpeechOutputSchema,
  displayName: 'Kling Text to Speech',
  description:
    'Starts a Kling speech generation from text with a preset voice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling text-to-speech task and returns its task_id and status; read it with Kling Get Task using kind audio/tts, and its audio id can drive Kling Create Avatar Video or Kling Create Lip Sync. The Voice ID must support the chosen Voice Language, else the call fails with "Voice id not found".',
    idempotent: false,
  },
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to speak. Up to 1000 characters.',
      required: true,
    }),
    voiceId: Property.ShortText({
      displayName: 'Voice ID',
      description:
        'Kling voice preset ID, e.g. "genshin_vindi2". It must support the Voice Language.',
      required: true,
    }),
    voiceLanguage: Property.StaticDropdown({
      displayName: 'Voice Language',
      required: true,
      options: {
        options: [
          { label: 'Chinese (zh)', value: 'zh' },
          { label: 'English (en)', value: 'en' },
        ],
      },
    }),
    voiceSpeed: Property.Number({
      displayName: 'Voice Speed',
      description: 'Speech rate from 0.8 to 2.0.',
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/audio/tts',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          text: propsValue.text,
          voice_id: propsValue.voiceId,
          voice_language: propsValue.voiceLanguage,
          voice_speed: propsValue.voiceSpeed,
        },
      }),
    });
  },
});
