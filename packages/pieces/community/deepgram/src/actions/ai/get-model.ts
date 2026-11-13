import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { modelOutputSchema } from '../../output-schemas';
import { deepgramModels } from '../../common/models';

export const getModelAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_get_model',
  classification: 'READ',
  displayName: 'Get Model',
  description: 'Gets one Deepgram model build by its UUID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Deepgram speech-to-text model or text-to-speech voice build by its UUID: canonical name, architecture, languages, version, batch/streaming support and voice traits. Get the UUID from deepgram_list_models with One Row per Build on; a canonical name such as nova-3-general is not accepted. Empty project ID reads the public catalog. Read-only.',
    idempotent: true,
  },
  outputSchema: modelOutputSchema,
  props: {
    model_id: Property.ShortText({
      displayName: 'Model UUID',
      description:
        'The build UUID from deepgram_list_models with One Row per Build on.',
      required: true,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'A project ID from List Projects (list_projects) to read a custom model of that project. Leave empty for the public catalog.',
      required: false,
    }),
  },
  async run(context) {
    const modelId = (context.propsValue.model_id ?? '').trim();
    if (modelId.length === 0) {
      throw new Error('Enter a model UUID.');
    }
    return deepgramModels.getModel({
      apiKey: context.auth.secret_text,
      projectId: context.propsValue.project_id?.trim() || undefined,
      modelId,
    });
  },
});
