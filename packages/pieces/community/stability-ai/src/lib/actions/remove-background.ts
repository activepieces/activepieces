import { createAction } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

export const removeBackground = createAction({
  auth: stabilityAiAuth,
  name: 'remove_background',
  classification: 'READ',
  displayName: 'Remove Background',
  description: 'Cut out the subject of an image and make the background transparent (5 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes the background of an image and returns the subject on a transparent PNG or WebP; costs 5 credits. The input must be 4,096 to 4,194,304 pixels. To put the subject on a new background use Replace Background and Relight. Each call is charged.',
    idempotent: false,
  },
  props: {
    image: stabilityProps.image({
      displayName: 'Image',
      description: 'The image to cut out: 4,096 to 4,194,304 pixels in total.',
      required: true,
    }),
    output_format: stabilityProps.transparentOutputFormat(),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: imageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    return stabilityClient.generateImageFile({
      apiKey: context.auth.props.api_key,
      path: '/v2beta/stable-image/edit/remove-background',
      fields: {
        image: stabilityInput.readFile({ value: props.image, label: 'Image', required: true }),
        output_format: stabilityInput.transparentOutputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'background-removed',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
