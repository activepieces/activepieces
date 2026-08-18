import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const listModels = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'list_models',
  displayName: 'List Models',
  description:
    'Return the list of models available to the connected OpenAI account, optionally filtered by an ID substring.',
  aiMetadata: { description: 'Returns the model ids the connected API key can use, each with its creation timestamp and owner: the full catalog when no filter is given, or only the ids containing a case-insensitive substring such as gpt-4, embedding, or whisper when one is. Use it to confirm a model id exists on this account before passing it to ask_chatgpt, create_embedding, generate_image, or text_to_speech. Read-only and idempotent.', idempotent: true },
  props: {
    contains: Property.ShortText({
      displayName: 'Filter Substring',
      description:
        'Optional case-insensitive substring used to filter model IDs (e.g. `gpt-4`, `embedding`, `whisper`).',
      required: false,
    }),
  },
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
