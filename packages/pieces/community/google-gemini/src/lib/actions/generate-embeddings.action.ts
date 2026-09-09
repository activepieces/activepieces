import { createAction, Property } from '@activepieces/pieces-framework';
import { GoogleGenAI } from '@google/genai';
import { googleGeminiAuth } from '../auth';
import { getGeminiEmbeddingModelOptions } from '../common/common';
import { generateEmbeddingsActionOutputSchema } from '../output-schemas';

export const generateEmbeddingsAction = createAction({
  audience: 'both',
  name: 'generate_embeddings',
  classification: 'READ',
  auth: googleGeminiAuth,
  displayName: 'Generate Embeddings',
  description: 'Converts text into a numerical embedding vector using a Gemini embedding model.',
  aiMetadata: {
    description:
      'Converts input text into a numerical embedding vector for semantic search, similarity comparison, clustering, or classification. Set Task Type to the intended use (e.g. retrieval_document when indexing content, retrieval_query when searching it) for a better-tuned vector. Idempotent: the same text and settings always produce the same vector.',
    idempotent: true,
  },
  props: {
    text: Property.LongText({
      displayName: 'Text',
      required: true,
      description: 'The text to generate an embedding for.',
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      auth: googleGeminiAuth,
      refreshers: [],
      defaultValue: 'gemini-embedding-001',
      options: async ({ auth }) => getGeminiEmbeddingModelOptions({ auth }),
    }),
    taskType: Property.StaticDropdown({
      displayName: 'Task Type',
      description: 'Tunes the embedding for how it will be used.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Retrieval Query (searching)', value: 'RETRIEVAL_QUERY' },
          { label: 'Retrieval Document (indexing)', value: 'RETRIEVAL_DOCUMENT' },
          { label: 'Semantic Similarity', value: 'SEMANTIC_SIMILARITY' },
          { label: 'Classification', value: 'CLASSIFICATION' },
          { label: 'Clustering', value: 'CLUSTERING' },
          { label: 'Question Answering', value: 'QUESTION_ANSWERING' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Only used when Task Type is Retrieval Document; improves embedding quality for document search.',
      required: false,
    }),
    outputDimensionality: Property.Number({
      displayName: 'Output Dimensionality',
      description: 'Truncate the embedding to this many dimensions. Only supported on newer models.',
      required: false,
    }),
  },
  outputSchema: generateEmbeddingsActionOutputSchema,
  async run({ auth, propsValue }) {
    const { text, model, taskType, title, outputDimensionality } = propsValue;

    const genAI = new GoogleGenAI({ apiKey: auth.secret_text });

    const response = await genAI.models.embedContent({
      model,
      contents: text,
      config: {
        taskType,
        title,
        outputDimensionality,
      },
    });

    const embedding = response.embeddings?.[0];

    if (!embedding?.values) {
      throw new Error('No embedding returned from model response.');
    }

    return {
      embedding: embedding.values,
      dimensions: embedding.values.length,
    };
  },
});
