import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingRouteImageToVideoOutputSchema } from '../../../output-schemas';

export const klingRouteImageToVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_route_image_to_video',
  outputSchema: cometapiKlingRouteImageToVideoOutputSchema,
  displayName: 'Kling Route Image to Video',
  description:
    'Starts a Kling image-to-video task on a model route (kling-2.5-turbo to kling-4.0).',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling image-to-video task on the /image-to-video/{model} route from a first frame (plus optional middle/last frame and prompt) and returns data.id and status; poll data.id with Kling Route Get Task, not Kling Get Task. Pick it over Kling Image to Video for the new models; Middle Frame is kling-4.0 only, kling-3.0-turbo takes no Last Frame, and on kling-2.6/kling-2.5-turbo a last frame needs 1080p.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.klingRouteModel({ required: true }),
    firstFrame: Property.ShortText({
      displayName: 'First Frame Image',
      description: 'Public image URL or base64 JPG/PNG.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The motion to create.',
      required: false,
    }),
    middleFrame: Property.ShortText({
      displayName: 'Middle Frame Image',
      description: 'kling-4.0 only. Public image URL or base64 JPG/PNG.',
      required: false,
    }),
    lastFrame: Property.ShortText({
      displayName: 'Last Frame Image',
      description:
        'Not on kling-3.0-turbo. Public image URL or base64 JPG/PNG.',
      required: false,
    }),
    resolution: cometApiAiProps.klingRouteResolution({ required: false }),
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
        'Any other top-level request body fields as a JSON object. contents, settings and options are built from the inputs above.',
    }),
  },
  async run({ auth, propsValue }) {
    const { prompt, middleFrame, lastFrame, multiShot, watermark } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: `/image-to-video/${encodeURIComponent(propsValue.model)}`,
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          contents: [
            ...(prompt ? [{ type: 'prompt', text: prompt }] : []),
            { type: 'first_frame', url: propsValue.firstFrame },
            ...(middleFrame
              ? [{ type: 'middle_frame', url: middleFrame }]
              : []),
            ...(lastFrame ? [{ type: 'last_frame', url: lastFrame }] : []),
          ],
          settings: {
            resolution: propsValue.resolution,
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
