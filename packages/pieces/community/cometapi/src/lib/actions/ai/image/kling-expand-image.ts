import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingExpandImageOutputSchema } from '../../../output-schemas';

const RATIO_DESCRIPTION =
  'Expansion as a multiple of the original dimension, 0 to 2. Use 0 for no expansion on this side.';

export const klingExpandImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_expand_image',
  outputSchema: cometapiKlingExpandImageOutputSchema,
  displayName: 'Kling Expand Image',
  description:
    'Starts a Kling task that outpaints an image beyond its borders.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Kling outpainting task that extends an image on each side by a ratio of its size, and returns data.task_id and data.task_status. Read the result with Kling Get Task (Task Kind images/editing/expand). All four ratios are required; start small (0.1). Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    image: cometApiAiProps.klingImage({ required: true }),
    upExpansionRatio: Property.Number({
      displayName: 'Up Expansion Ratio',
      description: RATIO_DESCRIPTION,
      required: true,
    }),
    downExpansionRatio: Property.Number({
      displayName: 'Down Expansion Ratio',
      description: RATIO_DESCRIPTION,
      required: true,
    }),
    leftExpansionRatio: Property.Number({
      displayName: 'Left Expansion Ratio',
      description: RATIO_DESCRIPTION,
      required: true,
    }),
    rightExpansionRatio: Property.Number({
      displayName: 'Right Expansion Ratio',
      description: RATIO_DESCRIPTION,
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Guides what fills the expanded area, up to 2500 characters.',
      required: false,
    }),
    n: cometApiAiProps.numberOfImages({ required: false }),
    watermark: cometApiAiProps.watermark({
      required: false,
      description: 'Whether to add the official Kling watermark.',
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { watermark } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/images/editing/expand',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          image: propsValue.image,
          up_expansion_ratio: propsValue.upExpansionRatio,
          down_expansion_ratio: propsValue.downExpansionRatio,
          left_expansion_ratio: propsValue.leftExpansionRatio,
          right_expansion_ratio: propsValue.rightExpansionRatio,
          prompt: propsValue.prompt,
          n: propsValue.n,
          watermark_info:
            watermark === undefined
              ? undefined
              : { enabled: cometApiUtils.toBoolean({ value: watermark }) },
        },
      }),
    });
  },
});
