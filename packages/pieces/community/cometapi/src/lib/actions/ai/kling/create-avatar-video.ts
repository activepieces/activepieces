import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingApplyVideoEffectOutputSchema } from '../../../output-schemas';

export const klingCreateAvatarVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_create_avatar_video',
  outputSchema: cometapiKlingApplyVideoEffectOutputSchema,
  displayName: 'Kling Create Avatar Video',
  description:
    'Starts a Kling talking-avatar video from one image and one audio source.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling avatar task that makes a face image speak a 2-60 s audio clip and returns its task_id and status; poll it with Kling Get Task using kind videos/avatar/image2video. Give exactly one of Audio ID (e.g. from a Kling Text to Speech task) or Sound File (a hosted MP3/WAV/M4A/AAC URL).',
    idempotent: false,
  },
  props: {
    image: Property.ShortText({
      displayName: 'Avatar Image',
      description:
        'Public image URL or base64 string of the face. Tiny thumbnails are rejected.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The avatar performance to create.',
      required: true,
    }),
    audioId: Property.ShortText({
      displayName: 'Audio ID',
      description:
        'Audio ID from a prior Kling audio task, e.g. Kling Text to Speech. Use this or Sound File.',
      required: false,
    }),
    soundFile: Property.ShortText({
      displayName: 'Sound File',
      description:
        'Public audio URL (MP3, WAV, M4A or AAC). Use this or Audio ID.',
      required: false,
    }),
    taskId: Property.ShortText({
      displayName: 'Audio Task ID',
      description:
        'The task_id of the prior task that produced Audio ID, when it must be linked.',
      required: false,
    }),
    mode: cometApiAiProps.klingMode({
      required: false,
      description: 'Defaults to std.',
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { audioId, soundFile } = propsValue;
    if (Boolean(audioId) === Boolean(soundFile)) {
      throw new Error('Provide exactly one of Audio ID or Sound File.');
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/avatar/image2video',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          image: propsValue.image,
          prompt: propsValue.prompt,
          audio_id: audioId,
          sound_file: soundFile,
          task_id: propsValue.taskId,
          mode: propsValue.mode,
        },
      }),
    });
  },
});
