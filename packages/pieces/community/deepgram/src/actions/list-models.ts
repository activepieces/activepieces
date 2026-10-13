import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { deepgramModels } from '../common/models';
import { deepgramProps } from '../common/props';
import { listModelsOutputSchema } from '../output-schemas';

export const listModelsAction = createAction({
  auth: deepgramAuth,
  name: 'list_models',
  classification: 'SEARCH',
  displayName: 'List Models and Voices',
  description:
    'Lists Deepgram speech-to-text models and text-to-speech voices, one row per model.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists Deepgram speech-to-text models and text-to-speech voices with their canonical IDs, languages and voice traits, one row per model (versions merged). Use to pick a model ID for deepgram_transcribe_audio or a voice ID for deepgram_generate_speech; filter by type and language. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listModelsOutputSchema,
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'Speech to text and voices', value: 'all' },
          { label: 'Speech to text models', value: 'stt' },
          { label: 'Text to speech voices', value: 'tts' },
        ],
      },
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description:
        'Only list models for this language code, for example en, es or de. "en" also matches en-US and en-GB.',
      required: false,
    }),
    project: {
      ...deepgramProps.project(),
      description:
        'Pick a project to also list custom models trained for it. Leave empty for the public catalog.',
    },
    includeOutdated: Property.Checkbox({
      displayName: 'Include Older Versions',
      description:
        'Also consider models that are no longer the latest version.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return listModels({
      apiKey: context.auth.secret_text,
      input: context.propsValue,
    });
  },
});

export async function listModels({
  apiKey,
  input,
}: {
  apiKey: string;
  input: ListModelsInput;
}) {
  const type = input.type;
  if (type !== 'all' && type !== 'stt' && type !== 'tts') {
    throw new Error('Type must be all, stt or tts.');
  }
  const options = {
    apiKey,
    projectId: input.project?.trim() || undefined,
    type,
    language: input.language ?? undefined,
    includeOutdated: input.includeOutdated === true,
  } as const;
  const models =
    input.perBuild === true
      ? await deepgramModels.listModelBuilds(options)
      : await deepgramModels.listModels(options);
  return { models, count: models.length };
}

export type ListModelsInput = {
  type?: string;
  language?: string;
  project?: string;
  includeOutdated?: boolean;
  perBuild?: boolean;
};
