import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { FaissStore } from 'langchain/vectorstores/faiss';
import path from 'path';
import os from 'os';

const embedding = new OpenAIEmbeddings({
  openAIApiKey: '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'
});

const docs = [
  new Document({
    metadata: { foo: 'notion' },
    pageContent:
      'Ashraf is CEO of Activepieces, He loves to code and eat pizza in italy :O'
  }),
  new Document({
    metadata: { id: 'notion' },
    pageContent:
      'Activepieces Open source no-code workflow builder, designed to be extensible'
  })
];

let vectorStore: FaissStore | undefined;

async function getStore(botId: string) {
  if (!vectorStore) {
    const hiddenFolderPath = path.join(os.homedir(), '.activepieces');
    // Check if the folder exists

    vectorStore = await FaissStore.load(
      hiddenFolderPath,
      new OpenAIEmbeddings({
      })
    );
  }
  return vectorStore;
}

export interface ApEmbeddings {
  query: ({ input }: { input: string }) => Promise<string[]>;
}

export const memoryEmbedding = (botId: string) => ({
  async query({ input }: { input: string }) {
    const store = await getStore(botId);
    const similarDocuments = await store.similaritySearch(input, 10, botId);
    return similarDocuments.map((doc) => doc.pageContent);
  }
});
