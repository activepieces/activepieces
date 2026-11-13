import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationGenerateOutlineOutputSchema } from '../../output-schemas';

export const generateOutline = createAction({
  auth: presentonAuth,
  name: 'presentation_generate_outline',
  outputSchema: presentationGenerateOutlineOutputSchema,
  displayName: 'Generate Outline',
  description: 'Generate slide outlines for a topic without creating a deck.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Generates an array of slide outlines from content using a paid LLM call; no presentation is created. Output differs on every call. Use to draft or review structure before presentation_generate_presentation.',
    idempotent: false,
  },
  props: {
    content: Property.LongText({ displayName: 'Content', required: true }),
    instructions: Property.LongText({ displayName: 'Instructions', required: false }),
    n_slides: Property.Number({ displayName: 'Number of Slides', required: false }),
    language: Property.ShortText({ displayName: 'Language', required: false }),
    tone: Property.StaticDropdown({
      displayName: 'Tone',
      required: false,
      options: {
        options: [
          { value: 'default', label: 'Default' },
          { value: 'casual', label: 'Casual' },
          { value: 'professional', label: 'Professional' },
          { value: 'funny', label: 'Funny' },
          { value: 'educational', label: 'Educational' },
          { value: 'sales_pitch', label: 'Sales pitch' },
        ],
      },
    }),
    verbosity: Property.StaticDropdown({
      displayName: 'Verbosity',
      required: false,
      options: {
        options: [
          { value: 'concise', label: 'Concise' },
          { value: 'standard', label: 'Standard' },
          { value: 'text-heavy', label: 'Text-heavy' },
        ],
      },
    }),
    files: Property.Array({ displayName: 'File IDs', description: 'Ids returned by presentation_upload_source_files.', required: false }),
  },
  async run({ auth, propsValue }) {
    const outlines = await presentonClient.request<unknown[]>({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v3/presentation/outlines/generate',
      body: presentonClient.dropUndefined({
        ...propsValue,
        files: presentonClient.toStringArray(propsValue.files),
      }),
    });
    return { count: outlines.length, outlines };
  },
});
