import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

const docs = [
  new Document({
    metadata: { foo: 'bar' },
    pageContent: 'Ashraf is CEO of Activepieces, He loves to code and eat pizza in italy :O'
  }),
  new Document({
    metadata: { foo: 'bar' },
    pageContent:
      'Activepieces Open source no-code workflow builder, designed to be extensible'
  })
];

let vectorStore: MemoryVectorStore | undefined;

async function getStore() {
  if (!vectorStore) {
    vectorStore = await MemoryVectorStore.fromDocuments(
      docs,
      new OpenAIEmbeddings({
      })
    );
  }
  return vectorStore;
}

export interface ApEmbeddings {
  query: ({ input }: { input: string }) => Promise<string[]>;
}

export const memoryEmbedding = {
  async query({ input }: { input: string }) {
    const store = await getStore();
    const similarDocuments = await store.similaritySearch(input, 10);
    return similarDocuments.map((doc) => doc.pageContent);
  }
};
