import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingRouteImageToVideoOutputSchema } from '../../../output-schemas';

const MODELS = ['kling-4.0', 'kling-3.0-omni', 'kling-o1'];
const CONTENT_TYPES = [
  'prompt',
  'first_frame',
  'middle_frame',
  'last_frame',
  'refer_image',
  'feature_video',
  'base_video',
];

export const klingRouteOmniVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_route_omni_video',
  outputSchema: cometapiKlingRouteImageToVideoOutputSchema,
  displayName: 'Kling Route Omni Video',
  description:
    'Starts a Kling Omni video task on a model route (kling-4.0, kling-3.0-omni, kling-o1).',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling Omni video task on the /omni-video/{model} route from mixed prompt, frame, reference-image and reference-video contents and returns data.id and status; poll data.id with Kling Route Get Task. Pick it over Kling Create Omni Video for kling-4.0/kling-3.0-omni or video references; a last_frame needs a first_frame, base_video cannot be combined with frames, and on kling-3.0-omni feature_video needs Multi Shot true with Audio off.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      options: { options: cometApiUtils.toOptions({ values: MODELS }) },
    }),
    contents: Property.Array({
      displayName: 'Contents',
      description:
        'Inputs, e.g. one prompt item for text-only. Prompt items use Text, the others use URL.',
      required: true,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'middle_frame is kling-4.0 only.',
          required: true,
          options: {
            options: cometApiUtils.toOptions({ values: CONTENT_TYPES }),
          },
        }),
        text: Property.LongText({
          displayName: 'Text',
          description: 'Prompt text, for a prompt item.',
          required: false,
        }),
        url: Property.ShortText({
          displayName: 'URL',
          description:
            'Image URL or base64 image, or a public video URL for video items.',
          required: false,
        }),
      },
    }),
    resolution: cometApiAiProps.klingRouteResolution({
      required: false,
      description: '4k is kling-3.0-omni only. Defaults to 720p.',
    }),
    aspectRatio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'adaptive is kling-4.0 only. Defaults to 16:9.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({
          values: ['adaptive', '16:9', '9:16', '1:1'],
        }),
      },
    }),
    duration: cometApiAiProps.klingRouteDuration({
      required: false,
      description:
        'kling-4.0 3-30, kling-3.0-omni 3-15, kling-o1 3-10. Defaults to 10 for kling-4.0 and 5 otherwise.',
    }),
    multiShot: cometApiAiProps.klingMultiShot({
      required: false,
      description:
        'kling-3.0-omni only: true for multiple shots, false for one. Not for kling-o1.',
    }),
    audio: Property.StaticDropdown({
      displayName: 'Audio',
      description: 'Not for kling-4.0. kling-o1 takes original or off.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({
          values: ['native', 'original', 'off'],
        }),
      },
    }),
    watermark: cometApiAiProps.watermark({ required: false }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({
      required: false,
      description: 'HTTPS URL that receives task status updates.',
    }),
    externalTaskId: cometApiAiProps.klingExternalTaskId({
      required: false,
      description: 'Your own tracking ID.',
    }),
    additionalFields: cometApiAiProps.additionalFields({
      required: false,
      description:
        'Any other top-level request body fields as a JSON object. settings and options are built from the inputs above.',
    }),
  },
  async run({ auth, propsValue }) {
    const { multiShot, watermark } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: `/omni-video/${encodeURIComponent(propsValue.model)}`,
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          contents: propsValue.contents,
          settings: {
            resolution: propsValue.resolution,
            aspect_ratio: propsValue.aspectRatio,
            duration: propsValue.duration,
            multi_shot: multiShot
              ? cometApiUtils.toBoolean({ value: multiShot })
              : undefined,
            audio: propsValue.audio,
          },
          options: {
            callback_url: propsValue.callbackUrl,
            external_task_id: propsValue.externalTaskId,
            watermark_info: watermark
              ? { enabled: cometApiUtils.toBoolean({ value: watermark }) }
              : undefined,
          },
        },
      }),
    });
  },
});
