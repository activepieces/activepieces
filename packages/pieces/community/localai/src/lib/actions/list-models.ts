import { createAction, Property } from '@activepieces/pieces-framework';
import { localaiAuth } from '../auth';
import { localaiCommon } from '../common';
import { listModelsOutputSchema } from '../output-schemas';

export const listModels = createAction({
  audience: 'both',
  auth: localaiAuth,
  name: 'list_models',
  classification: 'SEARCH',
  displayName: 'List Models',
  description: 'List the models installed on your LocalAI server.',
  aiMetadata: { description: 'Returns the ids of the models installed on the connected self-hosted LocalAI server, optionally only those whose id contains a case-insensitive text such as llama, embed, or whisper. The list covers every kind of model the server has (chat, embedding, speech, transcription) and LocalAI does not say which is which, so pick by name. Use it to confirm a model id exists before calling ask_localai, create_embedding, text_to_speech, or transcribe_audio. Read-only and idempotent.', idempotent: true },
  props: {
    contains: Property.ShortText({
      displayName: 'Name Contains',
      description: 'Only return models whose id includes this text.',
      placeholder: 'e.g. llama',
      required: false,
    }),
  },
  outputSchema: listModelsOutputSchema,
  async run({ auth, propsValue }) {
    const filter = propsValue.contains?.trim().toLowerCase();
    try {
      const response = await localaiCommon.client(auth).models.list();
      const models = response.data
        .filter((model) => !filter || model.id.toLowerCase().includes(filter))
        .map((model) => ({ id: model.id }));
      return { count: models.length, models };
    } catch (error) {
      throw localaiCommon.friendlyError(error);
    }
  },
});
