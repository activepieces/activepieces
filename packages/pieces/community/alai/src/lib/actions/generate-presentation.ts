import { createAction, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';
import { exportFormatOptions, optionalInt } from './shared-props';

export const LANGUAGES = [
  'English (US)', 'English (UK)', 'Spanish (Latin America)', 'Spanish (Mexico)', 'Spanish (Spain)', 'French', 'German',
  'Italian', 'Portuguese (Brazil)', 'Portuguese (Portugal)', 'Dutch', 'Polish', 'Russian', 'Japanese', 'Korean',
  'Chinese (Simplified)', 'Hindi', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek', 'Turkish', 'Czech', 'Hungarian',
  'Romanian', 'Bulgarian', 'Ukrainian', 'Vietnamese', 'Thai', 'Indonesian', 'Serbian', 'Croatian', 'Bosnian', 'Slovenian',
  'Macedonian', 'Albanian', 'Montenegrin', 'Lithuanian',
];
export const SLIDE_RANGES = ['auto', '1', '2-5', '6-10', '11-15', '16-20', '21-25', '26-50'];
export const TONES = ['DEFAULT', 'PROFESSIONAL', 'CASUAL', 'TECHNICAL', 'EDUCATIONAL', 'INSPIRATIONAL', 'NARRATIVE', 'PERSUASIVE', 'AUTHORITATIVE', 'EMPATHETIC'];
export const CONTENT_MODES = ['PRESERVE', 'CONDENSE', 'ENHANCE', 'CUSTOM'];
export const AMOUNT_MODES = ['MINIMAL', 'ESSENTIAL', 'BALANCED', 'DETAILED'];
const CONTENT_MODE_HINTS: Record<string, string> = {
  PRESERVE: 'Keep the input text as written.',
  CONDENSE: 'Condense the input text.',
  ENHANCE: 'Expand and enhance the input text.',
};
export const IMAGE_STYLES = ['auto', 'realistic', 'artistic', 'cartoon', 'three_d', 'custom'];

export const generatePresentation = createAction({
  auth: alaiAuth,
  name: 'generatePresentation',
  classification: 'WRITE',
  displayName: 'Generate Presentation',
  description: 'Create a new AI-generated presentation from text.',
  audience: 'human',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Starts a new Alai presentation generated from input text. Uses Alai AI credits (more slides cost more); Alai allows 5 generations at once per user. By default returns at once with generation_id and status "pending"; set waitForCompletion to wait (max 480 s) and get presentation_id and link/pdf/ppt URLs. Theme, vibe and image IDs come from List Themes, List Vibes and Upload Images. Tone, content mode and text density are added to the instructions sent to Alai. Not idempotent: each call creates another presentation.',
    idempotent: false,
  },
  props: {
    inputText: Property.LongText({
      displayName: 'Input Text',
      description: 'The content to turn into slides: plain text, markdown or notes.',
      required: true,
    }),
    additionalInstructions: Property.LongText({
      displayName: 'Additional Instructions',
      description: 'Extra guidance on style or focus for Alai.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Presentation title. If empty, Alai uses its default title.',
      required: false,
    }),
    slideRange: Property.StaticDropdown({
      displayName: 'Slide Range',
      description: 'Target number of slides. "auto" decides from the input length.',
      required: false,
      options: { options: SLIDE_RANGES.map((value) => ({ label: value, value })) },
    }),
    tone: Property.StaticDropdown({
      displayName: 'Tone',
      description: 'Tone of voice. Sent to Alai as part of the instructions.',
      required: false,
      options: { options: TONES.map((value) => ({ label: titleCase(value), value })) },
    }),
    contentMode: Property.StaticDropdown({
      displayName: 'Content Mode',
      description: 'Keep, shorten or expand your text. Sent as part of the instructions.',
      required: false,
      options: { options: CONTENT_MODES.map((value) => ({ label: titleCase(value), value })) },
    }),
    amountMode: Property.StaticDropdown({
      displayName: 'Text Density',
      description: 'How much text per slide. Sent as part of the instructions.',
      required: false,
      options: { options: AMOUNT_MODES.map((value) => ({ label: titleCase(value), value })) },
    }),
    themeId: Property.ShortText({
      displayName: 'Theme ID',
      description: 'Theme ID from "List Themes". If empty, Alai uses its default theme.',
      required: false,
    }),
    vibeId: Property.ShortText({
      displayName: 'Vibe ID',
      description: 'Vibe ID from "List Vibes".',
      required: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Output language. If empty, Alai matches the input language.',
      required: false,
      options: { options: LANGUAGES.map((value) => ({ label: value, value })) },
    }),
    variantsPerSlide: Property.Number({
      displayName: 'Variants per Slide',
      description: 'Design options per slide (1-4). More use more credits.',
      required: false,
    }),
    imageIds: Property.Array({
      displayName: 'Image IDs',
      description: 'IDs from "Upload Images" to use in the slides.',
      required: false,
    }),
    includeAiImages: Property.Checkbox({
      displayName: 'Include AI Images',
      description: 'Let Alai generate images for the slides.',
      required: false,
      defaultValue: true,
    }),
    includeWebImages: Property.Checkbox({
      displayName: 'Include Web Images',
      description: 'Let Alai search the web for images.',
      required: false,
      defaultValue: true,
    }),
    imageStyle: Property.StaticDropdown({
      displayName: 'Image Style',
      description: 'Style of AI images. "custom" needs Image Style Instructions.',
      required: false,
      options: {
        options: IMAGE_STYLES.map((value) => ({ label: value === 'three_d' ? '3D' : titleCase(value.toUpperCase()), value })),
      },
    }),
    imageStyleInstructions: Property.LongText({
      displayName: 'Image Style Instructions',
      description: 'Describe the image look. Required when Image Style is "custom".',
      required: false,
    }),
    exportFormats: Property.StaticMultiSelectDropdown({
      displayName: 'Export Formats',
      description: 'Formats to produce when the deck is ready. Default: link.',
      required: false,
      options: { options: exportFormatOptions },
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait until Alai finishes. If off, use "Get Generation" with the returned ID later.',
      required: false,
      defaultValue: false,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'How long to wait when waiting is on. Default 300, capped at 480.',
      required: false,
      defaultValue: 300,
    }),
  },
  async run({ auth, propsValue }) {
    const { body, formats } = buildGenerationBody({ input: propsValue });
    return alaiClient.startGeneration({
      apiKey: auth.props.apiKey,
      path: '/generations',
      body,
      waitForCompletion: propsValue.waitForCompletion,
      maxWaitTime: propsValue.maxWaitTime,
      requestedFormats: formats,
    });
  },
});


export type GenerationInput = {
  inputText?: string;
  additionalInstructions?: string;
  title?: string;
  slideRange?: unknown;
  tone?: unknown;
  contentMode?: unknown;
  amountMode?: unknown;
  themeId?: string;
  vibeId?: string;
  language?: string;
  variantsPerSlide?: unknown;
  imageIds?: unknown[];
  includeAiImages?: boolean;
  includeWebImages?: boolean;
  imageStyle?: string;
  imageStyleInstructions?: string;
  exportFormats?: unknown;
};

export function buildGenerationBody({ input }: { input: GenerationInput }): { body: Record<string, unknown>; formats: string[] } {
  const inputText = (input.inputText ?? '').trim();
  if (inputText.length === 0) {
    throw new Error('Input Text is required.');
  }
  const formats = alaiClient.exportFormats(input.exportFormats);
  const style = input.imageStyle === '' ? undefined : input.imageStyle;
  if (style !== undefined && style !== null && !IMAGE_STYLES.includes(style)) {
    throw new Error(`Image Style must be one of ${IMAGE_STYLES.join(', ')}.`);
  }
  const styleInstructions = input.imageStyleInstructions?.trim();
  if (style === 'custom' && !styleInstructions) {
    throw new Error('Image Style Instructions are required when Image Style is "custom".');
  }
  const slideRange = input.slideRange === '' ? undefined : input.slideRange;
  if (slideRange !== undefined && slideRange !== null && !SLIDE_RANGES.includes(String(slideRange))) {
    throw new Error(`Slide Range must be one of ${SLIDE_RANGES.join(', ')}.`);
  }
  const language = input.language === '' ? undefined : input.language;
  if (language !== undefined && language !== null && !LANGUAGES.includes(language)) {
    throw new Error(`Language "${language}" is not supported by Alai.`);
  }
  const variants = optionalInt({ value: input.variantsPerSlide, label: 'Variants per Slide', min: 1, max: 4 });
  const imageIds = (input.imageIds ?? []).map((id) => String(id).trim()).filter((id) => id.length > 0);

  const presentationOptions: Record<string, unknown> = {};
  if (input.title?.trim()) presentationOptions['title'] = input.title.trim();
  if (input.themeId?.trim()) presentationOptions['theme_id'] = input.themeId.trim();
  if (input.vibeId?.trim()) presentationOptions['vibe_id'] = input.vibeId.trim();
  if (slideRange) presentationOptions['slide_range'] = String(slideRange);
  if (variants !== undefined) presentationOptions['total_variants_per_slide'] = variants;

  const imageOptions: Record<string, unknown> = {};
  if (typeof input.includeAiImages === 'boolean') imageOptions['include_ai_images'] = input.includeAiImages;
  if (typeof input.includeWebImages === 'boolean') imageOptions['include_web_images'] = input.includeWebImages;
  if (style) imageOptions['style'] = style;
  if (styleInstructions) imageOptions['style_instructions'] = styleInstructions;

  const body: Record<string, unknown> = {
    input_text: inputText,
    export_formats: formats.length > 0 ? formats : ['link'],
  };
  const instructions = buildInstructions({
    additionalInstructions: input.additionalInstructions,
    tone: input.tone,
    contentMode: input.contentMode,
    amountMode: input.amountMode,
  });
  if (instructions) body['additional_instructions'] = instructions;
  if (imageIds.length > 0) body['image_ids'] = imageIds;
  if (Object.keys(presentationOptions).length > 0) body['presentation_options'] = presentationOptions;
  if (language) body['text_options'] = { language };
  if (Object.keys(imageOptions).length > 0) body['image_options'] = imageOptions;
  return { body, formats: formats.length > 0 ? formats : ['link'] };
}

function titleCase(value: string): string {
  return value[0] + value.slice(1).toLowerCase();
}

function buildInstructions({
  additionalInstructions,
  tone,
  contentMode,
  amountMode,
}: {
  additionalInstructions: string | undefined;
  tone: unknown;
  contentMode: unknown;
  amountMode: unknown;
}): string | undefined {
  const parts: string[] = [];
  if (typeof tone === 'string' && TONES.includes(tone) && tone !== 'DEFAULT') parts.push(`Use a ${tone.toLowerCase()} tone.`);
  if (typeof contentMode === 'string' && CONTENT_MODE_HINTS[contentMode]) parts.push(CONTENT_MODE_HINTS[contentMode]);
  if (typeof amountMode === 'string' && AMOUNT_MODES.includes(amountMode)) parts.push(`Text density per slide: ${amountMode.toLowerCase()}.`);
  const extra = additionalInstructions?.trim();
  if (extra) parts.push(extra);
  return parts.length > 0 ? parts.join(' ') : undefined;
}
