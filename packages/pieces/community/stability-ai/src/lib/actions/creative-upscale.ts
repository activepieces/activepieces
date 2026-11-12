import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { asyncImageOutputSchema } from '../common/output-schemas';

export const creativeUpscale = createAction({
  auth: stabilityAiAuth,
  name: 'creative_upscale',
  classification: 'READ',
  displayName: 'Creative Upscale',
  description:
    'Upscale a small or degraded image to 4K, reimagining details (60 credits). Runs as a background job; optionally waits up to 4 minutes for the result.',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts a Stability AI job that upscales a low-resolution or degraded image (up to 1 megapixel) to about 4K while reimagining details from an English prompt; costs 60 credits. With Wait for Result "yes" it checks every 10 seconds until 4 minutes after the job was sent and returns the image; otherwise, or if it is still running, it returns a generation ID to pass to Get Generation Result. Output defaults to WebP because PNG results can exceed the Activepieces file size limit (10 MB on Cloud). Use Upscale Image for cheaper upscales that keep the original details. Each call starts and charges a new job.',
    idempotent: false,
  },
  props: {
    image: stabilityProps.image({
      displayName: 'Image',
      description: 'Image to upscale: 4,096 to 1,048,576 pixels in total.',
      required: true,
    }),
    prompt: stabilityProps.prompt(true),
    negative_prompt: stabilityProps.negativePrompt(),
    creativity: Property.Number({
      displayName: 'Creativity',
      description: '0.1 to 0.5: how much new detail may be added. Stability AI uses 0.3 when empty.',
      required: false,
    }),
    style_preset: stabilityProps.stylePreset(),
    seed: stabilityProps.seed(),
    output_format: stabilityProps.upscaledOutputFormat(),
    wait_for_result: stabilityProps.waitForResult(),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: asyncImageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const image = stabilityInput.readFile({ value: props.image, label: 'Image', required: true });
    const prompt = stabilityInput.requireText({ value: props.prompt, label: 'Prompt' });
    return stabilityClient.startAndMaybeWait({
      apiKey: context.auth.props.api_key,
      path: '/v2beta/stable-image/upscale/creative',
      fields: {
        image,
        prompt,
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        creativity: stabilityInput.readNumber({ value: props.creativity, label: 'Creativity', min: 0.1, max: 0.5 }),
        style_preset: stabilityInput.styleChoice(props.style_preset),
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.upscaledOutputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'upscaled-creative',
      outputFileName: stabilityInput.readText(props.output_file_name),
      waitForCompletion: stabilityInput.readYesNo({ value: props.wait_for_result, defaultValue: true }),
    });
  },
});
