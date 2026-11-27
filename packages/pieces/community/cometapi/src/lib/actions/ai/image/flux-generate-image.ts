import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiFluxGenerateImageOutputSchema } from '../../../output-schemas';

export const fluxGenerateImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_flux_generate_image',
  outputSchema: cometapiFluxGenerateImageOutputSchema,
  displayName: 'FLUX Generate Image',
  description:
    'Generates or edits an image with a FLUX.2 model in the native BFL format.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Generates an image from a prompt with a FLUX.2 model (flux-2-pro, flux-2-flex, flux-2-max), or edits up to two public HTTPS reference images. By default it returns the task id and status under task; read the image with FLUX Get Result. Set Async to false to wait and get the image at result.result.sample directly. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description:
        'FLUX.2 model ID, e.g. "flux-2-pro", "flux-2-flex" or "flux-2-max".',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Text describing the image or the edit to the reference images.',
      required: true,
    }),
    inputImage: Property.ShortText({
      displayName: 'Input Image URL',
      description: 'Public HTTPS URL of a reference image to edit.',
      required: false,
    }),
    inputImage2: Property.ShortText({
      displayName: 'Second Input Image URL',
      description:
        'Public HTTPS URL of a second reference image, flux-2-pro only. Needs Input Image URL.',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Output width in pixels, e.g. 1280.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Output height in pixels, e.g. 768.',
      required: false,
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      options: {
        options: [
          { label: 'png', value: 'png' },
          { label: 'jpeg', value: 'jpeg' },
        ],
      },
    }),
    seed: Property.Number({
      displayName: 'Seed',
      required: false,
    }),
    async: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Async',
      description:
        'true (default) returns a task id for FLUX Get Result; false waits for the finished image.',
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { async } = propsValue;
    const response = await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: `/flux/v1/${encodeURIComponent(propsValue.model)}`,
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          prompt: propsValue.prompt,
          input_image: propsValue.inputImage,
          input_image_2: propsValue.inputImage2,
          width: propsValue.width,
          height: propsValue.height,
          output_format: propsValue.outputFormat,
          seed: propsValue.seed,
          async: cometApiUtils.toBoolean({ value: async }),
        },
      }),
    });
    return async !== 'false' ? { task: response } : { result: response };
  },
});
