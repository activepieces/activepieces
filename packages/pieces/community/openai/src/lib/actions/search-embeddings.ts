import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const searchEmbeddings = createAction({
  audience: 'human',
  auth: openaiAuth,
  name: 'search_embeddings',
  displayName: 'Search Embeddings',
  description:
    'Matches a query string to a list of document strings for best results.',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'The embedding model to use for both query and documents.',
      defaultValue: 'text-embedding-3-small',
      options: {
        options: [
          { label: 'text-embedding-3-small', value: 'text-embedding-3-small' },
          { label: 'text-embedding-3-large', value: 'text-embedding-3-large' },
          { label: 'text-embedding-ada-002', value: 'text-embedding-ada-002' },
        ],
      },
    }),
    query: Property.LongText({
      displayName: 'Query',
      description: 'The text to match against the documents.',
      required: true,
    }),
    documents: Property.Array({
      displayName: 'Documents',
      description: 'The list of document strings to search.',
      required: true,
    }),
    topK: Property.Number({
      displayName: 'Top K',
      description:
        'Return only the top K best matches. Leave empty to return all documents ranked by score.',
      required: false,
    }),
  },
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { model, query, topK } = context.propsValue;

    const documents = (context.propsValue.documents as unknown[]).map((d) =>
      String(d)
    );

    const response = await openai.embeddings.create({
      model,
      input: [query, ...documents],
    });

    const [queryEmbedding, ...docEmbeddings] = response.data.map(
      (d) => d.embedding
    );

    const ranked = docEmbeddings
      .map((embedding, index) => ({
        document: documents[index],
        index,
        score: cosineSimilarity({ a: queryEmbedding, b: embedding }),
      }))
      .sort((a, b) => b.score - a.score);

    const results =
      typeof topK === 'number' && topK > 0 ? ranked.slice(0, topK) : ranked;

    return {
      bestMatch: results[0] ?? null,
      results,
      usage: response.usage,
    };
  },
});

function cosineSimilarity({ a, b }: { a: number[]; b: number[] }): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
