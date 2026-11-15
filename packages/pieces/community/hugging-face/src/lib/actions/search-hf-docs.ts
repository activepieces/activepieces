import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfUtils } from '../common/utils';
import { searchHfDocsOutputSchema } from '../output-schemas';

const HEADING_KEYS = ['heading1', 'heading2', 'heading3', 'heading4', 'heading5'];

const DOC_PRODUCTS = [
  'hub',
  'transformers',
  'diffusers',
  'datasets',
  'gradio',
  'trackio',
  'smolagents',
  'huggingface_hub',
  'cli',
  'huggingface.js',
  'transformers.js',
  'inference-providers',
  'inference-endpoints',
  'peft',
  'accelerate',
  'optimum',
  'optimum-habana',
  'optimum-neuron',
  'optimum-intel',
  'optimum-executorch',
  'optimum-tpu',
  'tokenizers',
  'llm-course',
  'context-course',
  'robotics-course',
  'mcp-course',
  'smol-course',
  'agents-course',
  'deep-rl-course',
  'computer-vision-course',
  'evaluate',
  'tasks',
  'dataset-viewer',
  'trl',
  'openenv',
  'simulate',
  'sagemaker',
  'timm',
  'safetensors',
  'tgi',
  'setfit',
  'audio-course',
  'lerobot',
  'reachy_mini',
  'autotrain',
  'tei',
  'bitsandbytes',
  'cookbook',
  'sentence_transformers',
  'ml-games-course',
  'diffusion-course',
  'ml-for-3d-course',
  'chat-ui',
  'leaderboards',
  'lighteval',
  'argilla',
  'distilabel',
  'microsoft-azure',
  'kernels',
  'google-cloud',
  'xet',
];

export const searchHfDocs = createAction({
  auth: huggingFaceAuth,
  name: 'search_hf_docs',
  classification: 'SEARCH',
  displayName: 'Search Hugging Face Docs',
  description: 'Search the official Hugging Face documentation.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches the official Hugging Face documentation (Hub, Transformers, Datasets, Inference Providers, Inference Endpoints, the huggingface_hub client and many more) and returns the best-matching passages, each with its page title, section headings, URL and text. Optionally restrict to one product. Use it to look up how a Hub feature, API parameter or library works. Returns at most 25 passages and no pagination. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: searchHfDocsOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: "What to look for, in plain words, for example 'webhook secret header'. Up to 250 characters.",
      required: true,
    }),
    product: Property.StaticDropdown({
      displayName: 'Product',
      description: 'Only search the documentation of this product. Leave empty to search all of them.',
      required: false,
      options: {
        disabled: false,
        options: DOC_PRODUCTS.map((product) => ({ label: product, value: product })),
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of passages to return (1 to 25). Defaults to 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { query, product, limit } = context.propsValue;
    const q = query.trim();
    if (q.length === 0 || q.length > 250) {
      throw new Error('Query must be between 1 and 250 characters.');
    }
    hfUtils.assertLimit({ value: limit, min: 1, max: 25, name: 'Limit' });
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/docs/search',
      query: [
        ['q', q],
        ['product', product],
        ['limit', limit],
      ],
    });
    const hits = Array.isArray(response.body) ? response.body.filter(hfHub.isRecord) : [];
    const results = hits.map((hit) => ({
      title: pickString({ source: hit, key: 'source_page_title' }),
      url: pickString({ source: hit, key: 'source_page_url' }),
      product: pickString({ source: hit, key: 'product' }),
      section: HEADING_KEYS.map((key) => pickString({ source: hit, key }))
        .filter((heading): heading is string => heading !== null && heading.length > 0)
        .join(' > '),
      text: pickString({ source: hit, key: 'text' }),
    }));
    return { results, count: results.length };
  },
});

function pickString({ source, key }: PickParams): string | null {
  const value = source[key];
  return typeof value === 'string' ? value : null;
}

type PickParams = {
  source: Record<string, unknown>;
  key: string;
};
