import { Document } from 'langchain/document';

export interface ApEmbeddings {
  query: ({ input }: { input: string }) => Promise<string[]>;
  addDocuments: ({ documents, datasourceId }: {datasourceId: string, documents: Document[]}) => Promise<void>;
  deleteDocuments: ({ datasourceId }: {datasourceId: string}) => Promise<void>;
}

