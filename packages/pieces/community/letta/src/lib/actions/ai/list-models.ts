import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaListModels = createAction({
  auth: lettaAuth,
  name: 'letta_list_models',
  displayName: 'List Models',
  description: 'Lists available LLM or embedding models.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.modelList,
  aiMetadata: {
    description:
      'Lists the models the Letta server can use. Each item has a handle to pass as Model (or Embedding Model) to Create Agent / Update Agent. Set Embedding Models to yes to list embedding models instead of LLMs. Read-only.',
    idempotent: true,
  },
  props: {
    embedding: lettaProps.aiYesNo({ displayName: 'Embedding Models', description: 'yes = list embedding models; no (default) = list LLMs.' }),
    provider_name: Property.ShortText({ displayName: 'Provider Name', description: 'Only LLMs from this provider, such as openai. Ignored for embedding models.', required: false }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    if (lettaApi.resolveYesNo(propsValue.embedding)) {
      const models = await lettaApi.callLetta(() => client.models.embeddings.list());
      const items = models.map((model) => ({
        handle: model.handle ?? null,
        name: model.name,
        display_name: model.display_name,
        kind: 'embedding',
        provider_type: model.provider_type,
        context_window: null,
        embedding_dim: model.embedding_dim,
      }));
      return { items, count: items.length };
    }
    const models = await lettaApi.callLetta(() =>
      client.models.list({ provider_name: lettaApi.optionalText(propsValue.provider_name) })
    );
    const items = models.map((model) => ({
      handle: model.handle ?? null,
      name: model.name,
      display_name: model.display_name ?? null,
      kind: 'llm',
      provider_type: model.provider_type,
      context_window: model.context_window,
      embedding_dim: null,
    }));
    return { items, count: items.length };
  },
});
