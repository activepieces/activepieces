import { createAction, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';
import { buildSlideRequest } from './add-slide';
import { AMOUNT_MODES, buildGenerationBody, CONTENT_MODES, LANGUAGES, SLIDE_RANGES, TONES } from './generate-presentation';
import { exportFormatOptions } from './shared-props';

const enumOptions = (values: string[]) => ({ options: values.map((value) => ({ label: value, value })) });

const presentationIdAi = Property.ShortText({
  displayName: 'Presentation ID',
  description: 'The presentation ID, e.g. from List Presentations or the presentation_id of Get Generation.',
  required: true,
});

export const generatePresentationAi = createAction({
  auth: alaiAuth,
  name: 'generate_presentation_ai',
  classification: 'WRITE',
  displayName: 'Generate Presentation (Agent)',
  description: 'Start generating a new presentation from text.',
  audience: 'ai',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Starts generating a new Alai presentation from inputText and creates it with a shareable link. Returns generation_id right away; call Get Generation with it about every 5 seconds until status is "completed" or "failed". The finished job has presentation_id and link_url. Uses Alai AI credits (more slides cost more); max 5 generations at once per user. themeId comes from List Themes, vibeId from List Vibes. Not idempotent: each call creates another presentation, so do not retry a call that returned a generation_id.',
    idempotent: false,
  },
  props: {
    inputText: Property.LongText({ displayName: 'Input Text', description: 'The content to turn into slides (plain text or markdown).', required: true }),
    title: Property.ShortText({ displayName: 'Title', description: 'Presentation title.', required: false }),
    additionalInstructions: Property.LongText({ displayName: 'Additional Instructions', description: 'Extra guidance on style or focus.', required: false }),
    slideRange: Property.StaticDropdown({ displayName: 'Slide Range', description: 'Target slide count. "auto" decides from the input.', required: false, options: enumOptions(SLIDE_RANGES) }),
    tone: Property.StaticDropdown({ displayName: 'Tone', description: 'Tone of voice.', required: false, options: enumOptions(TONES) }),
    contentMode: Property.StaticDropdown({ displayName: 'Content Mode', description: 'Keep, condense or enhance the input text.', required: false, options: enumOptions(CONTENT_MODES) }),
    amountMode: Property.StaticDropdown({ displayName: 'Text Density', description: 'How much text per slide.', required: false, options: enumOptions(AMOUNT_MODES) }),
    themeId: Property.ShortText({ displayName: 'Theme ID', description: 'Theme ID from List Themes.', required: false }),
    vibeId: Property.ShortText({ displayName: 'Vibe ID', description: 'Vibe ID from List Vibes.', required: false }),
    language: Property.StaticDropdown({ displayName: 'Language', description: 'Output language; empty matches the input.', required: false, options: enumOptions(LANGUAGES) }),
    imageIds: Property.Array({ displayName: 'Image IDs', description: 'Image IDs uploaded to Alai earlier.', required: false }),
  },
  async run({ auth, propsValue }) {
    const { body } = buildGenerationBody({ input: { ...propsValue, exportFormats: ['link'] } });
    return alaiClient.startGeneration({ apiKey: auth.props.apiKey, path: '/generations', body, waitForCompletion: false, maxWaitTime: undefined, requestedFormats: ['link'] });
  },
});

export const addSlideAi = createAction({
  auth: alaiAuth,
  name: 'add_slide_ai',
  classification: 'WRITE',
  displayName: 'Add Slide (Agent)',
  description: 'Start generating a new slide in an existing presentation.',
  audience: 'ai',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Starts generating one AI slide from slideContext and inserts it into an existing Alai presentation. slideOrder is a 0-based position; omit it to append. Returns generation_id right away; call Get Generation with it about every 5 seconds until status is "completed" or "failed". The job\'s slide_id is the new slide (use it with Delete Slide). Uses AI credits. Not idempotent: each call adds another slide.',
    idempotent: false,
  },
  props: {
    presentationId: presentationIdAi,
    slideContext: Property.LongText({ displayName: 'Slide Content', description: 'What the slide should contain.', required: true }),
    slideOrder: Property.Number({ displayName: 'Slide Position', description: '0-based position; omit to append at the end.', required: false }),
    slideType: Property.StaticDropdown({ displayName: 'Slide Type', description: 'classic (editable text) or creative (image-led).', required: false, options: enumOptions(['classic', 'creative']) }),
    includeAiImages: Property.Checkbox({ displayName: 'Include Images', description: 'false asks Alai for a slide without images.', required: false, defaultValue: true }),
    additionalInstructions: Property.LongText({ displayName: 'Additional Instructions', description: 'Extra guidance for this slide.', required: false }),
  },
  async run({ auth, propsValue }) {
    const { presentationId, body } = buildSlideRequest({
      input: {
        presentationId: propsValue.presentationId,
        slide_context: propsValue.slideContext,
        slide_order: propsValue.slideOrder,
        slideType: propsValue.slideType,
        includeAiImages: propsValue.includeAiImages,
        additionalInstructions: propsValue.additionalInstructions,
      },
    });
    return alaiClient.startGeneration({ apiKey: auth.props.apiKey, path: `/presentations/${presentationId}/slides`, body, waitForCompletion: false, maxWaitTime: undefined, requestedFormats: ['link'] });
  },
});

export const exportPresentationAi = createAction({
  auth: alaiAuth,
  name: 'export_presentation_ai',
  classification: 'WRITE',
  displayName: 'Export Presentation (Agent)',
  description: 'Start exporting a presentation as link, PDF and/or PowerPoint.',
  audience: 'ai',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Starts an export of an Alai presentation to the given formats: link, pdf, ppt. Returns generation_id right away; call Get Generation with it about every 5 seconds until status is "completed" or "failed". The finished job has link_url, pdf_url and ppt_url (signed, valid about 24 hours); a format with formats.<name>.status "failed" did not export. Not idempotent: each call starts a new export job (repeating it is harmless but wasteful).',
    idempotent: false,
  },
  props: {
    presentationId: presentationIdAi,
    formats: Property.StaticMultiSelectDropdown({ displayName: 'Formats', description: 'One or more of link, pdf, ppt.', required: true, options: { options: exportFormatOptions } }),
  },
  async run({ auth, propsValue }) {
    const presentationId = alaiClient.pathId({ value: propsValue.presentationId, label: 'Presentation ID' });
    const formats = alaiClient.exportFormats(propsValue.formats);
    if (formats.length === 0) {
      throw new Error('Give at least one format: link, pdf or ppt.');
    }
    return alaiClient.startGeneration({ apiKey: auth.props.apiKey, path: `/presentations/${presentationId}/exports`, body: { formats }, waitForCompletion: false, maxWaitTime: undefined, requestedFormats: formats });
  },
});

export const generateSpeakerNotesAi = createAction({
  auth: alaiAuth,
  name: 'generate_speaker_notes_ai',
  classification: 'WRITE',
  displayName: 'Generate Speaker Notes (Agent)',
  description: 'Start generating speaker notes for a presentation.',
  audience: 'ai',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Starts AI speaker-notes generation for an Alai presentation, for all slides or only slideIds. Returns generation_id right away; call Get Generation with it about every 5 seconds until status is "completed" or "failed". The finished job has transcripts (slide_id, slide_order, title, content), which also give you slide IDs. Uses AI credits per slide. Not idempotent: each call uses credits again.',
    idempotent: false,
  },
  props: {
    presentationId: presentationIdAi,
    slideIds: Property.Array({ displayName: 'Slide IDs', description: 'Only these slides; omit for all slides.', required: false }),
  },
  async run({ auth, propsValue }) {
    const presentationId = alaiClient.pathId({ value: propsValue.presentationId, label: 'Presentation ID' });
    const slideIds = (propsValue.slideIds ?? []).map((id) => String(id).trim()).filter((id) => id.length > 0);
    return alaiClient.startGeneration({ apiKey: auth.props.apiKey, path: `/presentations/${presentationId}/transcripts`, body: slideIds.length > 0 ? { slide_ids: slideIds } : {}, waitForCompletion: false, maxWaitTime: undefined, requestedFormats: [] });
  },
});
