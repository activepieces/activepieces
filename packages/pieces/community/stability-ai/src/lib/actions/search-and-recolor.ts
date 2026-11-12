import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { imageOutputSchema } from '../common/output-schemas';

export const searchAndRecolor = createAction({
  auth: stabilityAiAuth,
  name: 'search_and_recolor',
  classification: 'READ',
  displayName: 'Search and Recolor',
  description: 'Change the color of an object in an image by describing it, no mask needed (5 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Finds the object named in Select Prompt and recolors it as the English Prompt describes, keeping its shape; costs 5 credits. To swap the object for something else use Search and Replace. Each call is charged.',
    idempotent: false,
  },
  props: {
    image: stabilityProps.image({ displayName: 'Image', description: 'The image to edit.', required: true }),
    select_prompt: Property.ShortText({
      displayName: 'Select Prompt',
      description: 'Short description of the object to recolor, for example "car".',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'English description of the new colors, for example "a bright red car".',
      required: true,
    }),
    negative_prompt: stabilityProps.negativePrompt(),
    grow_mask: Property.Number({
      displayName: 'Grow Mask',
      description: '0 to 20 pixels to expand and soften the detected area. Stability AI uses 3 when empty.',
      required: false,
    }),
    style_preset: stabilityProps.stylePreset(),
    seed: stabilityProps.seed(),
    output_format: stabilityProps.outputFormat(),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: imageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const image = stabilityInput.readFile({ value: props.image, label: 'Image', required: true });
    const target = stabilityInput.requireText({ value: props.select_prompt, label: 'Select Prompt' });
    const prompt = stabilityInput.requireText({ value: props.prompt, label: 'Prompt' });
    return stabilityClient.generateImageFile({
      apiKey: context.auth.props.api_key,
      path: '/v2beta/stable-image/edit/search-and-recolor',
      fields: {
        image,
        select_prompt: target,
        prompt,
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        grow_mask: stabilityInput.readNumber({ value: props.grow_mask, label: 'Grow Mask', min: 0, max: 20 }),
        style_preset: stabilityInput.styleChoice(props.style_preset),
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'recolored',
      outputFileName: stabilityInput.readText(props.output_file_name),
    });
  },
});
