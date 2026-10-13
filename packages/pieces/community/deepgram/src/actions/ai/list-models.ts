import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { listModelBuildsOutputSchema } from '../../output-schemas';
import { listModels, listModelsAction } from '../list-models';

const { project: _project, ...originalProps } = listModelsAction.props;

export const listModelsAiAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_list_models',
  classification: 'SEARCH',
  displayName: 'List Models and Voices (Agent)',
  description:
    'Lists Deepgram speech-to-text models and text-to-speech voices, one row per model or one row per build.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Deepgram speech-to-text models and text-to-speech voices with canonical IDs, languages and voice traits. Use to pick a model for deepgram_transcribe_audio or a voice (type tts) for deepgram_generate_speech. Turn on One Row per Build to get build UUIDs for deepgram_get_model; then narrow with language, because one model can have over 100 builds. Empty project ID lists the public catalog. Read-only.',
    idempotent: true,
  },
  outputSchema: listModelBuildsOutputSchema,
  props: {
    ...originalProps,
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'A project ID from List Projects (list_projects) to also list custom models trained for it. Leave empty for the public catalog.',
      required: false,
    }),
    perBuild: Property.Checkbox({
      displayName: 'One Row per Build',
      description:
        'Return one row per language/version build with its UUID instead of one merged row per model.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { project_id, ...input } = context.propsValue;
    return listModels({
      apiKey: context.auth.secret_text,
      input: { ...input, project: project_id ?? undefined },
    });
  },
});
