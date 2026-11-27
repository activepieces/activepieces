import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiUtils } from '../../../common/utils';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const RESOLUTIONS = ['720p', '1k', '2k', '4k'];

const FLAVORS = ['vivid', 'natural'];

export const runwayUpscaleVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_upscale_video',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Upscale Video',
  description: 'Starts a Magnific upscale of a video through Runway.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Magnific (magnific_video_upscaler_creative) upscale of a video up to 30 seconds to 720p, 1k, 2k or 4k and returns the task id; poll it with Runway Get Task. Use Runway Video to Video to change the content instead. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    videoUri: Property.ShortText({
      displayName: 'Video URL',
      description:
        'The video to upscale, up to 30 seconds: a public HTTPS URL or a Base64 video data URI up to 5 MB.',
      required: true,
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'Target output resolution. Defaults to 2k.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: RESOLUTIONS }),
      },
    }),
    creativity: Property.Number({
      displayName: 'Creativity',
      description:
        'Amount of generated detail to add, 1 through 100. Leave empty for the model default.',
      required: false,
    }),
    sharpen: Property.Number({
      displayName: 'Sharpen',
      description:
        'Sharpness intensity, 1 through 100. Leave empty for the model default.',
      required: false,
    }),
    smartGrain: Property.Number({
      displayName: 'Smart Grain',
      description:
        'Grain and texture enhancement intensity, 1 through 100. Leave empty for the model default.',
      required: false,
    }),
    flavor: Property.StaticDropdown({
      displayName: 'Flavor',
      description:
        'vivid emphasizes color and detail; natural favors faithful reproduction.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: FLAVORS }),
      },
    }),
    fpsBoost: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'FPS Boost',
      description:
        'true requests an increased output frame rate; false is the same as leaving it empty.',
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/video_upscale',
      body: {
        model: 'magnific_video_upscaler_creative',
        videoUri: propsValue.videoUri,
        resolution: propsValue.resolution,
        creativity: propsValue.creativity,
        sharpen: propsValue.sharpen,
        smartGrain: propsValue.smartGrain,
        flavor: propsValue.flavor,
        fpsBoost: cometApiUtils.toBoolean({ value: propsValue.fpsBoost }),
      },
    });
  },
});
