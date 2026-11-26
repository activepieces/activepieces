import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';
import { optionalInt, presentationIdProp } from './shared-props';

export const addSlide = createAction({
  auth: alaiAuth,
  name: 'addSlide',
  classification: 'WRITE',
  displayName: 'Add Slide',
  description: 'Generate a new slide and add it to an existing presentation.',
  audience: 'human',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Generates one new AI slide from slideContext and inserts it into an existing Alai presentation. slide_order is a 0-based position; leave it empty or "end" to append. includeAiImages=false and imageStyle are passed as instructions. Uses AI credits. By default returns at once with generation_id; set waitForCompletion to wait (max 480 s) and get the new slide_id. Not idempotent: each call adds another slide.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'presentation', display: 'section', label: 'Presentation', icon: 'file', props: ['presentationId', 'slide_order'] },
    { key: 'content', display: 'section', label: 'Content', icon: 'text', props: ['slide_context', 'additionalInstructions'] },
    { key: 'design', display: 'section', label: 'Design', icon: 'sliders', props: ['slideType', 'variantsPerSlide', 'includeAiImages', 'imageStyle'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'send', props: ['info', 'waitForCompletion'] },
  ],
  props: {
    presentationId: presentationIdProp('The presentation to add the slide to.'),
    slide_context: Property.LongText({
      displayName: 'Slide Content',
      description: 'What the slide should contain.',
      required: true,
    }),
    additionalInstructions: Property.LongText({
      displayName: 'Additional Instructions',
      description: 'Guidance on the style or focus of this slide.',
      required: false,
    }),
    slide_order: Property.ShortText({
      displayName: 'Slide Position',
      description: '0-based position for the slide. Empty or "end" adds it last.',
      placeholder: 'end',
      required: false,
    }),
    slideType: Property.StaticDropdown({
      displayName: 'Slide Type',
      description: 'Classic (editable text) or Creative (image-led). Default: Classic.',
      required: false,
      options: {
        options: [
          { label: 'Classic', value: 'classic' },
          { label: 'Creative', value: 'creative' },
        ],
      },
    }),
    includeAiImages: Property.Checkbox({
      displayName: 'Include Images',
      description: 'Turn off to ask Alai for a slide without images.',
      required: false,
      defaultValue: true,
    }),
    imageStyle: Property.ShortText({
      displayName: 'Image Style',
      description: 'Style for the slide\'s images when images are on.',
      placeholder: 'realistic',
      required: false,
    }),
    variantsPerSlide: Property.Number({
      displayName: 'Variants',
      description: 'Design options for this slide, 1 to 4.',
      required: false,
    }),
    info: Property.MarkDown({
      value: 'Alai builds the slide in the background and uses AI credits. Without waiting, pass the returned generation ID to **Get Generation** later.',
      variant: MarkdownVariant.INFO,
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait until Alai finishes; the step fails after Max Wait Time.',
      required: false,
      defaultValue: false,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time',
      description: 'Seconds to wait when waiting is on. Default 300, max 480.',
      advanced: true,
      required: false,
      defaultValue: 300,
    }),
  },
  async run({ auth, propsValue }) {
    const { presentationId, body } = buildSlideRequest({ input: propsValue });
    return alaiClient.startGeneration({
      apiKey: auth.props.apiKey,
      path: `/presentations/${presentationId}/slides`,
      body,
      waitForCompletion: propsValue.waitForCompletion,
      maxWaitTime: propsValue.maxWaitTime,
      requestedFormats: ['link'],
    });
  },
});

export type SlideInput = {
  presentationId?: string;
  slide_context?: string;
  additionalInstructions?: string;
  slide_order?: unknown;
  slideType?: string;
  includeAiImages?: boolean;
  imageStyle?: string;
  variantsPerSlide?: unknown;
};

export function buildSlideRequest({ input }: { input: SlideInput }): { presentationId: string; body: Record<string, unknown> } {
  const presentationId = alaiClient.pathId({ value: input.presentationId, label: 'Presentation ID' });
  const slideContext = (input.slide_context ?? '').trim();
  if (slideContext.length === 0) {
    throw new Error('Slide Content is required.');
  }
  const rawOrder = typeof input.slide_order === 'string' ? input.slide_order.trim() : input.slide_order;
  const slideOrder = rawOrder === 'end' ? undefined : optionalInt({ value: rawOrder, label: 'Slide Position', min: 0 });
  const variants = optionalInt({ value: input.variantsPerSlide, label: 'Variants', min: 1, max: 4 });
  const slideType = input.slideType === '' ? undefined : input.slideType;
  if (slideType !== undefined && slideType !== null && slideType !== 'classic' && slideType !== 'creative') {
    throw new Error('Slide Type must be classic or creative.');
  }
  const options: Record<string, unknown> = {};
  const hints = [
    input.includeAiImages === false ? 'Do not use images on this slide.' : '',
    input.includeAiImages !== false && input.imageStyle?.trim() ? `Image style: ${input.imageStyle.trim()}.` : '',
    input.additionalInstructions?.trim() ?? '',
  ].filter((part) => part.length > 0);
  if (hints.length > 0) options['additional_instructions'] = hints.join(' ');
  if (slideType) options['slide_type'] = slideType;
  if (slideOrder !== undefined) options['slide_order'] = slideOrder;
  if (variants !== undefined) options['total_variants_per_slide'] = variants;
  return { presentationId, body: { slide_context: slideContext, options, export_formats: ['link'] } };
}
