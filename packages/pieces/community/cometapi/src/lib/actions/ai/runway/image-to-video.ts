import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const MODELS = ['gen4.5', 'gen4_turbo'];

const RATIOS = [
  '1280:720',
  '720:1280',
  '1104:832',
  '960:960',
  '832:1104',
  '1584:672',
];

export const runwayImageToVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_image_to_video',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Image to Video',
  description: 'Starts a Runway video generation that animates a source image.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway video generation that animates a first-frame image (gen4.5 or gen4_turbo) and returns the task id; poll it with Runway Get Task. Use Runway Text to Video when there is no image; gen4.5 also requires Prompt and Duration, and Output Format applies to gen4.5 only. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        'gen4.5 requires Prompt and Duration; gen4_turbo makes both optional.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: MODELS }),
      },
    }),
    promptImage: Property.ShortText({
      displayName: 'Image URL',
      description:
        'The first frame: a public HTTPS image URL (no redirects) or a Base64 image data URI up to 5 MB.',
      required: true,
    }),
    promptText: Property.LongText({
      displayName: 'Prompt',
      description:
        'The motion to generate, 1 to 1,000 characters. Required for gen4.5.',
      required: false,
    }),
    ratio: Property.StaticDropdown({
      displayName: 'Ratio',
      description: 'Output dimensions as width:height.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: RATIOS }),
      },
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description:
        'Video length in whole seconds, from 2 through 10. Required for gen4.5.',
      required: false,
    }),
    seed: cometApiAiProps.runwaySeed({ required: false }),
    outputFormat: cometApiAiProps.runwayOutputFormat({
      required: false,
      description:
        'Output encoding, gen4.5 only. Leave empty for H.264 MP4. Set proresProfile through Additional Fields for prores or hdr_prores.',
    }),
    publicFigureThreshold: cometApiAiProps.runwayPublicFigureThreshold({
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (!MODELS.includes(propsValue.model)) {
      throw new Error(`Model must be one of: ${MODELS.join(', ')}.`);
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/image_to_video',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model: propsValue.model,
          promptImage: propsValue.promptImage,
          promptText: propsValue.promptText,
          ratio: propsValue.ratio,
          duration: propsValue.duration,
          seed: propsValue.seed,
          outputFormat: propsValue.outputFormat,
          contentModeration: propsValue.publicFigureThreshold
            ? { publicFigureThreshold: propsValue.publicFigureThreshold }
            : undefined,
        },
      }),
    });
  },
});
