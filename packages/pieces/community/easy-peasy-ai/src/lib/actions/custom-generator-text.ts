import { createAction, Property } from '@activepieces/pieces-framework';
import { easyPeasyAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const customGeneratorText = createAction({
  auth: easyPeasyAiAuth,
  name: 'customGeneratorText',
  displayName: 'Custom Generator (Text)',
  description:
    'Generate custom text for any purpose using the EasyPeasy AI template engine',
  props: {
    keywords: Property.LongText({
      displayName: 'Keywords',
      description: 'What do you want to generate? (max 1000 characters)',
      required: true,
    }),
    extra1: Property.LongText({
      displayName: 'Background Information',
      description:
        'Additional context or background information (optional, max 1000 characters)',
      required: false,
    }),
    outputs: Property.Number({
      displayName: 'Number of Outputs',
      description: 'How many outputs to generate (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Language for the generated text (default: English)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'English', value: 'English' },
          { label: 'Spanish', value: 'Spanish' },
          { label: 'French', value: 'French' },
          { label: 'German', value: 'German' },
          { label: 'Italian', value: 'Italian' },
          { label: 'Portuguese', value: 'Portuguese' },
          { label: 'Dutch', value: 'Dutch' },
          { label: 'Russian', value: 'Russian' },
          { label: 'Chinese', value: 'Chinese' },
          { label: 'Japanese', value: 'Japanese' },
          { label: 'Korean', value: 'Korean' },
          { label: 'Hindi', value: 'Hindi' },
          { label: 'Arabic', value: 'Arabic' },
        ],
      },
      defaultValue: 'English',
    }),
    shouldUseGPT4: Property.Checkbox({
      displayName: 'Use GPT-4',
      description: 'Use GPT-4 model for generation (may incur higher costs)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { keywords, extra1, outputs, language, shouldUseGPT4 } =
      context.propsValue;

    const payload = {
      preset: 'custom-generator',
      keywords,
      outputs: outputs || 1,
      language: language || 'English',
      shouldUseGPT4: shouldUseGPT4 || false,
    };

    if (extra1) {
      Object.assign(payload, { extra1 });
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/api/generate',
      payload
    );

    return response;
  },
});
