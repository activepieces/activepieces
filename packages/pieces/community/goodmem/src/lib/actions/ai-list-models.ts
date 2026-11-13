import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas } from '../common';
import { goodmemApi, goodmemParsers } from '../common/client';

export const aiListModels = createAction({
  auth: goodmemAuth,
  name: 'ai_list_models',
  classification: 'READ',
  displayName: 'List Models',
  description: 'List the embedders, rerankers and LLMs configured on the GoodMem server.',
  audience: 'ai',
  aiMetadata: { description: 'Lists the models configured on the GoodMem server: embedders (needed by Create Space), rerankers and LLMs (optional for Retrieve Memories), with their IDs and display names. Use it to find a model ID before creating a space or running a reranked or LLM-assisted retrieval. Read-only and idempotent.', idempotent: true },
  outputSchema: goodmemOutputSchemas.listModels,
  props: {
    kind: Property.StaticDropdown<string>({
      displayName: 'Model Type',
      description: 'Which kind of model to list',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Embedders', value: 'embedders' },
          { label: 'Rerankers', value: 'rerankers' },
          { label: 'LLMs', value: 'llms' },
        ],
      },
    }),
  },
  async run(context) {
    const kind = context.propsValue.kind || 'all';
    const auth = extractAuthFromContext(context.auth);
    const embedders = kind === 'all' || kind === 'embedders'
      ? (await goodmemApi.listModels({ auth, kind: 'embedders' })).map(goodmemParsers.normalizeEmbedder)
      : [];
    const rerankers = kind === 'all' || kind === 'rerankers'
      ? (await goodmemApi.listModels({ auth, kind: 'rerankers' })).map(goodmemParsers.normalizeReranker)
      : [];
    const llms = kind === 'all' || kind === 'llms'
      ? (await goodmemApi.listModels({ auth, kind: 'llms' })).map(goodmemParsers.normalizeLlm)
      : [];
    return { embedders, rerankers, llms };
  },
});
