import { createAction, Property } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { stabilityInput, stabilityProps } from '../common/props';
import { asyncImageOutputSchema } from '../common/output-schemas';

const LIGHT_DIRECTIONS = ['left', 'right', 'above', 'below'];

export const replaceBackgroundAndRelight = createAction({
  auth: stabilityAiAuth,
  name: 'replace_background_and_relight',
  classification: 'READ',
  displayName: 'Replace Background and Relight',
  description:
    'Put the subject of a photo on a new background described by a prompt or a reference image, and adjust the lighting (8 credits). Runs as a background job; optionally waits up to 4 minutes.',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts a Stability AI job that keeps the subject of a photo, replaces the background from an English Background Prompt or a Background Reference image (one is required) and relights the scene; costs 8 credits. To only change the lighting, set Keep Original Background to "true" and describe the lighting in Background Prompt. With Wait for Result "yes" it checks every 10 seconds until 4 minutes after the job was sent and returns the image; otherwise, or if it is still running, it returns a generation ID for Get Generation Result. To only cut out the subject use Remove Background. Each call starts and charges a new job.',
    idempotent: false,
  },
  props: {
    subject_image: stabilityProps.image({
      displayName: 'Subject Image',
      description: 'Photo containing the subject to keep.',
      required: true,
    }),
    background_prompt: Property.LongText({
      displayName: 'Background Prompt',
      description:
        'English description of the new background, or only of the lighting when Keep Original Background is Yes. Required unless you give a Background Reference.',
      required: false,
    }),
    background_reference: stabilityProps.image({
      displayName: 'Background Reference',
      description: 'Image whose look the new background should follow. Required unless you give a Background Prompt.',
      required: false,
    }),
    foreground_prompt: Property.LongText({
      displayName: 'Foreground Prompt',
      description: 'Description of the subject, to stop the background from changing it.',
      required: false,
    }),
    negative_prompt: stabilityProps.negativePrompt(),
    preserve_original_subject: Property.Number({
      displayName: 'Preserve Original Subject',
      description: '0 to 1: how closely the subject keeps its original look. Stability AI uses 0.6 when empty.',
      required: false,
    }),
    original_background_depth: Property.Number({
      displayName: 'Original Background Depth',
      description: '0 to 1: how much the new background follows the depth of the original. Stability AI uses 0.5 when empty.',
      required: false,
    }),
    keep_original_background: Property.StaticDropdown<string, false>({
      displayName: 'Keep Original Background',
      description:
        'Yes: keep the original background and only change the lighting. Stability AI still needs a Background Prompt or Background Reference, so describe the lighting you want in Background Prompt.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    light_source_direction: Property.StaticDropdown<string, false>({
      displayName: 'Light Source Direction',
      description: 'Where the light comes from.',
      required: false,
      options: {
        disabled: false,
        options: LIGHT_DIRECTIONS.map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1), value })),
      },
    }),
    light_reference: stabilityProps.image({
      displayName: 'Light Reference',
      description: 'Image whose lighting the result should follow.',
      required: false,
    }),
    light_source_strength: Property.Number({
      displayName: 'Light Source Strength',
      description: '0 to 1. Needs a Light Reference or a Light Source Direction. Stability AI uses 0.3 when empty.',
      required: false,
    }),
    seed: stabilityProps.seed(),
    output_format: stabilityProps.outputFormat(),
    wait_for_result: stabilityProps.waitForResult(),
    output_file_name: stabilityProps.outputFileName(),
  },
  outputSchema: asyncImageOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const subjectImage = stabilityInput.readFile({ value: props.subject_image, label: 'Subject Image', required: true });
    const backgroundPrompt = stabilityInput.readText(props.background_prompt);
    const backgroundReference = stabilityInput.readFile({
      value: props.background_reference,
      label: 'Background Reference',
      required: false,
    });
    const keepOriginalBackground = stabilityInput.readChoice({
      value: props.keep_original_background,
      label: 'Keep Original Background',
      allowed: ['true', 'false'],
    });
    if (backgroundPrompt === undefined && backgroundReference === undefined) {
      if (keepOriginalBackground === 'true') {
        throw new Error(
          'Keep Original Background still needs a Background Prompt or a Background Reference image. To only change the lighting, describe the lighting in Background Prompt, for example "warm sunset light from the left".',
        );
      }
      throw new Error('Give a Background Prompt or a Background Reference image.');
    }
    const lightReference = stabilityInput.readFile({ value: props.light_reference, label: 'Light Reference', required: false });
    const lightDirection = stabilityInput.readChoice({
      value: props.light_source_direction,
      label: 'Light Source Direction',
      allowed: LIGHT_DIRECTIONS,
    });
    const lightStrength = stabilityInput.readNumber({
      value: props.light_source_strength,
      label: 'Light Source Strength',
      min: 0,
      max: 1,
    });
    if (lightStrength !== undefined && lightReference === undefined && lightDirection === undefined) {
      throw new Error('Light Source Strength needs a Light Reference image or a Light Source Direction.');
    }
    return stabilityClient.startAndMaybeWait({
      apiKey: context.auth.props.api_key,
      path: '/v2beta/stable-image/edit/replace-background-and-relight',
      fields: {
        subject_image: subjectImage,
        background_prompt: backgroundPrompt,
        background_reference: backgroundReference,
        foreground_prompt: stabilityInput.readText(props.foreground_prompt),
        negative_prompt: stabilityInput.readText(props.negative_prompt),
        preserve_original_subject: stabilityInput.readNumber({
          value: props.preserve_original_subject,
          label: 'Preserve Original Subject',
          min: 0,
          max: 1,
        }),
        original_background_depth: stabilityInput.readNumber({
          value: props.original_background_depth,
          label: 'Original Background Depth',
          min: 0,
          max: 1,
        }),
        keep_original_background: keepOriginalBackground,
        light_source_direction: lightDirection,
        light_reference: lightReference,
        light_source_strength: lightStrength,
        seed: stabilityInput.readSeed(props.seed),
        output_format: stabilityInput.outputFormatChoice(props.output_format),
      },
      files: context.files,
      fileNamePrefix: 'relit-image',
      outputFileName: stabilityInput.readText(props.output_file_name),
      waitForCompletion: stabilityInput.readYesNo({ value: props.wait_for_result, defaultValue: true }),
    });
  },
});
