import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiUtils } from '../../../common/utils';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const CHARACTER_TYPES = ['image', 'video'];

const RATIOS = [
  '1280:720',
  '720:1280',
  '960:960',
  '1104:832',
  '832:1104',
  '1584:672',
];

export const runwayCharacterPerformanceAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_character_performance',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Character Performance',
  description:
    'Starts a Runway Act-Two task that applies a recorded performance to a character.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway Act-Two (act_two) task that transfers the facial (and optionally body) performance of a 3-30 second reference video onto a character image or video, and returns the task id; poll it with Runway Get Task. The character needs a recognizable face in frame. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    characterType: Property.StaticDropdown({
      displayName: 'Character Type',
      description: 'Whether Character URL is an image or a video.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: CHARACTER_TYPES }),
      },
    }),
    characterUri: Property.ShortText({
      displayName: 'Character URL',
      description:
        'The character to animate, with a recognizable face in frame: a public HTTPS URL or a Base64 data URI up to 5 MB.',
      required: true,
    }),
    referenceUri: Property.ShortText({
      displayName: 'Reference Video URL',
      description:
        'The performance to apply, a 3 to 30 second video: a public HTTPS URL or a Base64 video data URI up to 5 MB.',
      required: true,
    }),
    bodyControl: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Body Control',
      description:
        'true also transfers body movements and gestures; false is the same as leaving it empty.',
    }),
    expressionIntensity: Property.Number({
      displayName: 'Expression Intensity',
      description:
        'From 1 through 5; higher requests stronger expressions. Defaults to 3.',
      required: false,
    }),
    seed: cometApiAiProps.runwaySeed({ required: false }),
    ratio: Property.StaticDropdown({
      displayName: 'Ratio',
      description: 'Output dimensions as width:height.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: RATIOS }),
      },
    }),
    publicFigureThreshold: cometApiAiProps.runwayPublicFigureThreshold({
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/character_performance',
      body: {
        model: 'act_two',
        character: {
          type: propsValue.characterType,
          uri: propsValue.characterUri,
        },
        reference: { type: 'video', uri: propsValue.referenceUri },
        bodyControl: cometApiUtils.toBoolean({ value: propsValue.bodyControl }),
        expressionIntensity: propsValue.expressionIntensity,
        seed: propsValue.seed,
        ratio: propsValue.ratio,
        contentModeration: propsValue.publicFigureThreshold
          ? { publicFigureThreshold: propsValue.publicFigureThreshold }
          : undefined,
      },
    });
  },
});
