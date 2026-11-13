import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import { listModelsActionOutputSchema } from '../output-schemas';

export const listModels = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'list_models',
  classification: 'SEARCH',
  displayName: 'List Models',
  description:
    'List the models your OpenAI account can use.',
  aiMetadata: { description: 'Returns the model ids the connected API key can use, each with its creation timestamp and owner: the full catalog when no filter is given, or only the ids containing a case-insensitive substring such as gpt-4, embedding, or whisper when one is. Use it to confirm a model id exists on this account before passing it to ask_chatgpt, create_embedding, generate_image, or text_to_speech. Read-only and idempotent.', idempotent: true },
  props: {
    contains: Property.ShortText({
      displayName: 'Name Contains',
      description: 'Only return models whose name includes this text.',
      placeholder: 'e.g. gpt-4o',
      required: false,
    }),
  },
  outputSchema: listModelsActionOutputSchema,
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { contains } = context.propsValue;

    const response = await openai.models.list();
    const all = response.data ?? [];
    const filter = contains?.toLowerCase().trim();

    const filtered = filter
      ? all.filter((m) => m.id.toLowerCase().includes(filter))
      : all;

    return {
      count: filtered.length,
      models: filtered.map((m) => ({ id: m.id, created: m.created, owned_by: m.owned_by })),
    };
  },
});
