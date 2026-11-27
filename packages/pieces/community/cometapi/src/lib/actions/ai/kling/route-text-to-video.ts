import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingRouteImageToVideoOutputSchema } from '../../../output-schemas';

export const klingRouteTextToVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_route_text_to_video',
  outputSchema: cometapiKlingRouteImageToVideoOutputSchema,
  displayName: 'Kling Route Text to Video',
  description:
    'Starts a Kling text-to-video task on a model route (kling-2.5-turbo to kling-4.0).',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling text-to-video task on the /text-to-video/{model} route and returns data.id and status; poll data.id with Kling Route Get Task, not Kling Get Task. Pick it over Kling Text to Video for kling-4.0 (3-30 s), kling-3.0 (3-15 s, up to 4k) and other new models; kling-2.6 and kling-2.5-turbo take 5 or 10 s, and Audio applies only to kling-3.0 and kling-2.6.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.klingRouteModel({ required: true }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'What the video shows.',
      required: true,
    }),
    resolution: cometApiAiProps.klingRouteResolution({ required: false }),
    aspectRatio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: '21:9 is kling-4.0 only. Defaults to 16:9.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({
          values: ['21:9', '16:9', '9:16', '1:1'],
        }),
      },
    }),
    duration: cometApiAiProps.klingRouteDuration({ required: false }),
    multiShot: cometApiAiProps.klingMultiShot({ required: false }),
    audio: cometApiAiProps.klingRouteAudio({ required: false }),
    watermark: cometApiAiProps.watermark({ required: false }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
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
      path: `/text-to-video/${encodeURIComponent(propsValue.model)}`,
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          prompt: propsValue.prompt,
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
