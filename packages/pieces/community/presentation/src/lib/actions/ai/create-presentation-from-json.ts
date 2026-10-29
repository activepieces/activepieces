import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationExportPresentationOutputSchema } from '../../output-schemas';

export const createPresentationFromJson = createAction({
  auth: presentonAuth,
  name: 'presentation_create_presentation_from_json',
  outputSchema: presentationExportPresentationOutputSchema,
  displayName: 'Create Presentation From JSON',
  description: 'Create a presentation from explicit slide layouts and content.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Builds a presentation synchronously from a list of slides, each with a layout name and a content object. Get the standard_template id from presentation_list_standard_templates and valid layouts and content schemas from presentation_get_standard_template. Each call creates a new presentation.',
    idempotent: false,
  },
  props: {
    standard_template: Property.ShortText({ displayName: 'Standard Template ID', required: true }),
    slides: Property.Json({
      displayName: 'Slides',
      description: 'Array of {"layout": string, "content": object, "speaker_note"?: string}.',
      required: true,
    }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    language: Property.ShortText({ displayName: 'Language', required: false, defaultValue: 'English' }),
    export_as: Property.StaticDropdown({
      displayName: 'Export As',
      required: false,
      defaultValue: 'pptx',
      options: {
        options: [
          { value: 'pptx', label: 'PPTX' },
          { value: 'pdf', label: 'PDF' },
          { value: 'png', label: 'PNG' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    if (!Array.isArray(propsValue.slides) || propsValue.slides.length === 0) {
      throw new Error('Slides must be a non-empty array.');
    }
    return presentonClient.request<Record<string, unknown>>({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v3/presentation/from-json',
      body: presentonClient.dropUndefined({
        standard_template: propsValue.standard_template,
        slides: propsValue.slides,
        title: propsValue.title,
        language: propsValue.language,
        export_as: propsValue.export_as,
      }),
    });
  },
});
