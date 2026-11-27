import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const RATIOS = ['1280:720', '720:1280'];

export const runwayTextToVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_text_to_video',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Text to Video',
  description: 'Starts a Runway Gen-4.5 video generation from a text prompt.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway Gen-4.5 (gen4.5) video generation from a text prompt alone and returns the task id; poll it with Runway Get Task until status is SUCCEEDED. Use Runway Image to Video to start from an image instead. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    promptText: Property.LongText({
      displayName: 'Prompt',
      description: 'The scene and motion to generate, 1 to 1,000 characters.',
      required: true,
    }),
    ratio: Property.StaticDropdown({
      displayName: 'Ratio',
      description:
        'Output dimensions as width:height: 1280:720 for landscape, 720:1280 for portrait.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: RATIOS }),
      },
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'Video length in whole seconds, from 2 through 10.',
      required: true,
    }),
    seed: cometApiAiProps.runwaySeed({ required: false }),
    outputFormat: cometApiAiProps.runwayOutputFormat({ required: false }),
    publicFigureThreshold: cometApiAiProps.runwayPublicFigureThreshold({
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/text_to_video',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model: 'gen4.5',
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
