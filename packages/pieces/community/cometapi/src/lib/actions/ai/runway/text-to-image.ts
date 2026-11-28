import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiUtils } from '../../../common/utils';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const MODELS = ['gen4_image', 'gen4_image_turbo'];

const RATIOS = [
  '1024:1024',
  '1080:1080',
  '1168:880',
  '1360:768',
  '1440:1080',
  '1080:1440',
  '1808:768',
  '1920:1080',
  '1080:1920',
  '2112:912',
  '1280:720',
  '720:1280',
  '720:720',
  '960:720',
  '720:960',
  '1680:720',
];

export const runwayTextToImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_text_to_image',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Text to Image',
  description:
    'Starts a Runway Gen-4 image generation from a prompt and optional reference images.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway Gen-4 image generation (gen4_image, or gen4_image_turbo which needs one to three reference images) and returns the task id; poll it with Runway Get Task. Tag a reference image and cite it in the prompt as @tag. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        'gen4_image takes zero to three reference images; gen4_image_turbo needs one to three.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: MODELS }),
      },
    }),
    promptText: Property.LongText({
      displayName: 'Prompt',
      description:
        'The image to generate, 1 to 1,000 characters. Cite a tagged reference image as @tag.',
      required: true,
    }),
    ratio: Property.StaticDropdown({
      displayName: 'Ratio',
      description:
        'Output dimensions as width:height, e.g. 1024:1024 square, 1920:1080 landscape.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: RATIOS }),
      },
    }),
    referenceImages: Property.Array({
      displayName: 'Reference Images',
      description:
        'Up to three reference images. Required (one to three) for gen4_image_turbo.',
      required: false,
      properties: {
        uri: Property.ShortText({
          displayName: 'Image URL',
          description:
            'A public HTTPS image URL (no redirects) or a Base64 image data URI up to 5 MB.',
          required: true,
        }),
        tag: Property.ShortText({
          displayName: 'Tag',
          description:
            '3 to 16 lowercase letters, digits or underscores, starting with a letter. Cite it in the prompt as @tag.',
          required: false,
        }),
      },
    }),
    seed: cometApiAiProps.runwaySeed({ required: false }),
    publicFigureThreshold: cometApiAiProps.runwayPublicFigureThreshold({
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!MODELS.includes(propsValue.model)) {
      throw new Error(`Model must be one of: ${MODELS.join(', ')}.`);
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/text_to_image',
      body: {
        model: propsValue.model,
        promptText: propsValue.promptText,
        ratio: propsValue.ratio,
        referenceImages: propsValue.referenceImages,
        seed: propsValue.seed,
        contentModeration: propsValue.publicFigureThreshold
          ? { publicFigureThreshold: propsValue.publicFigureThreshold }
          : undefined,
      },
    });
  },
});
