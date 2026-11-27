import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingImageToVideoOutputSchema } from '../../../output-schemas';

export const klingMotionControlAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_motion_control',
  outputSchema: cometapiKlingImageToVideoOutputSchema,
  displayName: 'Kling Motion Control',
  description:
    'Starts a Kling video that animates a character image with the motion of a reference video.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling Motion Control task on the legacy /kling/v1 route (kling-v2-6 or kling-v3) from a character image and a 3-30 s reference video and returns its task_id and status; poll it with Kling Get Task using kind videos/motion-control. Pick Kling Route Motion Control for the kling-2.6/kling-3.0 model routes. With orientation image the reference video may be at most 10 s.',
    idempotent: false,
  },
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Character Image',
      description:
        'Public JPG/PNG URL or raw base64 (no data: prefix), up to 10 MB, 300 px or more per side.',
      required: true,
    }),
    videoUrl: Property.ShortText({
      displayName: 'Reference Video URL',
      description:
        'Public MP4 or MOV URL, up to 100 MB, one continuous shot with one character.',
      required: true,
    }),
    characterOrientation: Property.StaticDropdown({
      displayName: 'Character Orientation',
      description:
        'image: follow the image (video 3-10 s). video: follow the reference video (video 3-30 s).',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: ['image', 'video'] }),
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Scene guidance. Up to 2,500 characters.',
      required: false,
    }),
    modelName: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Defaults to kling-v2-6.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({
          values: ['kling-v2-6', 'kling-v3'],
        }),
      },
    }),
    mode: cometApiAiProps.klingMode({
      required: false,
      description: 'Defaults to std.',
    }),
    keepOriginalSound: Property.StaticDropdown({
      displayName: 'Keep Original Sound',
      description: 'Keep the reference video audio. Defaults to yes.',
      required: false,
      options: { options: cometApiUtils.toOptions({ values: ['yes', 'no'] }) },
    }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
    externalTaskId: cometApiAiProps.klingExternalTaskId({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({
      required: false,
      description:
        'Any other request body fields as a JSON object, e.g. element_list or watermark_info. Dedicated inputs above take precedence over the same key here.',
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/motion-control',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          image_url: propsValue.imageUrl,
          video_url: propsValue.videoUrl,
          character_orientation: propsValue.characterOrientation,
          prompt: propsValue.prompt,
          model_name: propsValue.modelName,
          mode: propsValue.mode,
          keep_original_sound: propsValue.keepOriginalSound,
          callback_url: propsValue.callbackUrl,
          external_task_id: propsValue.externalTaskId,
        },
      }),
    });
  },
});
