import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingCreateOmniImageOutputSchema } from '../../../output-schemas';

const ASPECT_RATIOS = [
  'auto',
  '16:9',
  '9:16',
  '1:1',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '21:9',
];

export const klingCreateOmniImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_create_omni_image',
  outputSchema: cometapiKlingCreateOmniImageOutputSchema,
  displayName: 'Kling Create Omni Image',
  description:
    'Starts a Kling Omni image task from a prompt that can cite reference images.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Kling Omni image task from a prompt that cites reference images as <<<image_1>>>, <<<image_2>>> and so on, and returns data.task_id. Read the result with Kling Get Omni Image using that id. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    modelName: Property.ShortText({
      displayName: 'Model',
      description:
        'Omni image model ID, e.g. "kling-v3-omni" or "kling-image-o1". Leave empty for the route default.',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Text describing the image, up to 2500 characters. Cite references as <<<image_1>>>, <<<image_2>>> in Reference Images order.',
      required: true,
    }),
    imageList: Property.Array({
      displayName: 'Reference Images',
      description: 'Images the prompt can cite by position.',
      required: false,
      properties: {
        image: Property.ShortText({
          displayName: 'Image',
          description:
            'Image URL or Base64; JPG or PNG, up to 10 MB, at least 300 px per side.',
          required: true,
        }),
      },
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'Defaults to 1k.',
      required: false,
      options: {
        options: [
          { label: '1k', value: '1k' },
          { label: '2k', value: '2k' },
          { label: '4k', value: '4k' },
        ],
      },
    }),
    n: cometApiAiProps.numberOfImages({ required: false }),
    aspectRatio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Defaults to auto.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: ASPECT_RATIOS }),
      },
    }),
    watermark: cometApiAiProps.watermark({
      required: false,
      description: 'Whether to also return watermarked result URLs.',
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { watermark, imageList } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/images/omni-image',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model_name: propsValue.modelName,
          prompt: propsValue.prompt,
          image_list: imageList && imageList.length > 0 ? imageList : undefined,
          resolution: propsValue.resolution,
          n: propsValue.n,
          aspect_ratio: propsValue.aspectRatio,
          watermark_info:
            watermark === undefined
              ? undefined
              : { enabled: cometApiUtils.toBoolean({ value: watermark }) },
        },
      }),
    });
  },
});
