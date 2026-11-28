import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingApplyVideoEffectOutputSchema } from '../../../output-schemas';

export const klingApplyVideoEffectAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_apply_video_effect',
  outputSchema: cometapiKlingApplyVideoEffectOutputSchema,
  displayName: 'Kling Apply Video Effect',
  description:
    'Starts a Kling preset-effect video from one image or two people images.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling video-effects task for a preset effect scene and returns its task_id and status; poll it with Kling Get Task using kind videos/effects. Single-image scenes take Image, two-person interaction scenes take exactly two Images; unknown effect scenes are rejected.',
    idempotent: false,
  },
  props: {
    effectScene: Property.ShortText({
      displayName: 'Effect Scene',
      description:
        'A Kling preset effect scene name currently available in Kling.',
      required: true,
    }),
    image: Property.ShortText({
      displayName: 'Image',
      description:
        'Public image URL or base64 string, for single-image scenes. Use this or Images.',
      required: false,
    }),
    images: Property.Array({
      displayName: 'Images',
      description:
        'Exactly two image URLs or base64 strings, for two-person interaction scenes. Use this or Image.',
      required: false,
    }),
    duration: cometApiAiProps.klingDuration({
      required: true,
      description: 'Use 10 only when the scene supports it.',
    }),
    modelName: Property.ShortText({
      displayName: 'Model',
      description:
        'Model for two-person interaction scenes. Leave empty for the route default.',
      required: false,
    }),
    mode: cometApiAiProps.klingMode({
      required: false,
      description: 'For scenes that support it.',
    }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
    externalTaskId: cometApiAiProps.klingExternalTaskId({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { image } = propsValue;
    const images = propsValue.images ?? [];
    if (Boolean(image) === images.length > 0) {
      throw new Error('Provide exactly one of Image or Images.');
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/effects',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          effect_scene: propsValue.effectScene,
          input: {
            image,
            images: images.length > 0 ? images : undefined,
            duration: propsValue.duration,
            model_name: propsValue.modelName,
            mode: propsValue.mode,
          },
          callback_url: propsValue.callbackUrl,
          external_task_id: propsValue.externalTaskId,
        },
      }),
    });
  },
});
