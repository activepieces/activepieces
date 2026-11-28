import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingRouteImageToVideoOutputSchema } from '../../../output-schemas';

export const klingRouteMotionControlAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_route_motion_control',
  outputSchema: cometapiKlingRouteImageToVideoOutputSchema,
  displayName: 'Kling Route Motion Control',
  description:
    'Starts a Kling motion-control task on a model route (kling-3.0, kling-2.6).',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling motion-control task on the /motion-control/{model} route that animates a character image with a reference video and returns data.id and status; poll data.id with Kling Route Get Task, not Kling Get Task. Pick it over Kling Motion Control for the kling-3.0/kling-2.6 contract with a resolution choice; the reference video is 3-10 s with orientation image and 3-30 s with video.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      options: {
        options: cometApiUtils.toOptions({
          values: ['kling-3.0', 'kling-2.6'],
        }),
      },
    }),
    imageUrl: Property.ShortText({
      displayName: 'Character Image URL',
      description:
        'Public JPG or PNG URL, up to 50 MB, 300 px or more per side.',
      required: true,
    }),
    videoUrl: Property.ShortText({
      displayName: 'Reference Video URL',
      description: 'Public MP4 or MOV URL, at least 3 seconds, up to 100 MB.',
      required: true,
    }),
    characterOrientation: Property.StaticDropdown({
      displayName: 'Character Orientation',
      description:
        'image: follow the image (video up to 10 s). video: follow the reference video (up to 30 s).',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: ['image', 'video'] }),
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Scene guidance.',
      required: false,
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'Defaults to 720p.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: ['720p', '1080p'] }),
      },
    }),
    audio: Property.StaticDropdown({
      displayName: 'Audio',
      description: 'original keeps the reference video audio, off is silent.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: ['original', 'off'] }),
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
        'Any other top-level request body fields as a JSON object. contents, settings and options are built from the inputs above.',
    }),
  },
  async run({ auth, propsValue }) {
    const { prompt, watermark } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: `/motion-control/${encodeURIComponent(propsValue.model)}`,
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          contents: [
            ...(prompt ? [{ type: 'prompt', text: prompt }] : []),
            { type: 'image', url: propsValue.imageUrl },
            { type: 'video', url: propsValue.videoUrl },
          ],
          settings: {
            character_orientation: propsValue.characterOrientation,
            resolution: propsValue.resolution,
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
