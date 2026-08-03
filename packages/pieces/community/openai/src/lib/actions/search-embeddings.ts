import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const searchEmbeddings = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'search_embeddings',
  displayName: 'Search Embeddings',
  description:
    'Matches a query string to a list of document strings for best results.',
  aiMetadata: { description: 'Embeds a query and a list of document strings passed inline in the same call, then ranks those documents against the query by cosine similarity and returns the best match plus the scored ranking; setting Top K keeps only the leading matches, leaving it empty returns every document ranked. It is self-contained with no vector store, so the documents must be supplied on every run - use create_embedding with an external vector database when the corpus is large or must persist. Requires the query, the document list, and one embedding model used for both sides. Read-only and idempotent: the same inputs produce the same ranking.', idempotent: true },
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

    const inputs = [query, ...documents];
    const batchSize = 2048;
    const embeddings: number[][] = [];
    let totalTokens = 0;

    for (let i = 0; i < inputs.length; i += batchSize) {
      const response = await openai.embeddings.create({
        model,
        input: inputs.slice(i, i + batchSize),
      });
      embeddings.push(...response.data.map((d) => d.embedding));
      totalTokens += response.usage?.total_tokens ?? 0;
    }

    const [queryEmbedding, ...docEmbeddings] = embeddings;

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
      usage: { total_tokens: totalTokens },
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
