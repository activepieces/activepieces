import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from '@huggingface/inference';
import { huggingFaceAuth } from '../auth';
import { hfInference } from '../common/inference';
import { hfUtils } from '../common/utils';
import { generateEmbeddingsOutputSchema } from '../output-schemas';

const DEFAULT_EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5';

export const generateEmbeddings = createAction({
  auth: huggingFaceAuth,
  name: 'generate_embeddings',
  classification: 'READ',
  displayName: 'Generate Text Embeddings',
  description: 'Turn text into embedding vectors with a feature-extraction model served by Inference Providers.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Converts one or more texts into numeric embedding vectors with a Hugging Face feature-extraction model served by Inference Providers, for semantic search, clustering or similarity. One text returns a single embedding with its dimensions; several texts return one vector per text in the same order. Spends Inference Providers credits; the result is deterministic for a fixed model, so it is safe to retry.",
    idempotent: true,
  },
  outputSchema: generateEmbeddingsOutputSchema,
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description:
        "Feature-extraction model ID, for example 'BAAI/bge-small-en-v1.5' (384 dimensions) or 'intfloat/multilingual-e5-large'. Find others with Search Models (pipeline_tag 'feature-extraction', inference_provider 'all'); append ':<provider>' to pick the provider.",
      required: true,
      defaultValue: DEFAULT_EMBEDDING_MODEL,
    }),
    provider: hfInference.providerProp(),
    inputs: Property.Array({
      displayName: 'Texts',
      description: 'The texts to embed. One text returns one embedding; several texts return one embedding each, in order.',
      required: true,
    }),
    normalize: hfInference.optionalBooleanProp({
      displayName: 'Normalize',
      description: 'Scale each vector to unit length. Leave empty for the model default.',
    }),
    truncate: hfInference.optionalBooleanProp({
      displayName: 'Truncate',
      description: "Cut texts longer than the model's maximum input length instead of failing. Leave empty for the model default.",
    }),
    truncation_direction: Property.StaticDropdown({
      displayName: 'Truncation Direction',
      description: 'Which end of an over-long text to cut when truncating. Leave empty for the model default (right).',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Right (keep the start)', value: 'right' },
          { label: 'Left (keep the end)', value: 'left' },
        ],
      },
    }),
    prompt_name: Property.ShortText({
      displayName: 'Prompt Name',
      description:
        "Name of a prompt template defined in the model's Sentence Transformers config, for example 'query' or 'passage' for retrieval models. Leave empty when the model has none.",
      required: false,
    }),
  },
  async run(context) {
    const { model, provider, inputs, normalize, truncate, truncation_direction, prompt_name } = context.propsValue;
    const raw: unknown = inputs;
    const texts = typeof raw === 'string' ? hfUtils.toStringArray([raw]) : hfUtils.toStringArray(raw);
    if (texts.length === 0) {
      throw new Error('Provide at least one non-empty text to embed.');
    }
    const resolved = hfInference.resolveModelAndProvider({ model, provider, defaultModel: DEFAULT_EMBEDDING_MODEL });
    const normalizeFlag = hfUtils.booleanFlag(normalize);
    const truncateFlag = hfUtils.booleanFlag(truncate);
    const direction = truncation_direction === 'left' || truncation_direction === 'right' ? truncation_direction : undefined;
    const promptName = prompt_name?.trim();
    const client = new InferenceClient(context.auth.secret_text);
    try {
      const output = await client.featureExtraction({
        model: resolved.model,
        provider: resolved.provider,
        inputs: texts.length === 1 ? texts[0] : texts,
        ...(normalizeFlag !== undefined ? { normalize: normalizeFlag } : {}),
        ...(truncateFlag !== undefined ? { truncate: truncateFlag } : {}),
        ...(direction ? { truncation_direction: direction } : {}),
        ...(promptName ? { prompt_name: promptName } : {}),
      });
      if (texts.length === 1) {
        const embedding = isNumberArray(output) ? output : isNumberArray(output[0]) ? output[0] : null;
        if (embedding === null) {
          throw new Error(
            'The model returned token-level vectors instead of one pooled embedding. Use a sentence-embedding model such as BAAI/bge-small-en-v1.5.'
          );
        }
        return { model: resolved.model, embedding, dimensions: embedding.length };
      }
      const embeddings = output.filter(isNumberArray);
      if (embeddings.length !== texts.length) {
        throw new Error(
          'The model did not return one pooled embedding per text. Use a sentence-embedding model such as BAAI/bge-small-en-v1.5.'
        );
      }
      return {
        model: resolved.model,
        embeddings,
        count: embeddings.length,
        dimensions: embeddings[0]?.length ?? 0,
      };
    } catch (error) {
      throw hfInference.toError(error);
    }
  },
});

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'number');
}
