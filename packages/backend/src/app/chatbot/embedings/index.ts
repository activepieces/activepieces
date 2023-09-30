
import { Document } from 'langchain/document'
import { faissEmbedding } from './fais-embeddings'

export type ApEmbeddings = {
    query: ({ input }: { input: string }) => Promise<string[]>
    addDocuments: ({ botId, documents, datasourceId }: { datasourceId: string, documents: Document[], botId: string }) => Promise<void>
    deleteDocuments: ({ datasourceId }: { datasourceId: string }) => Promise<void>
}

type EmbeddingsFunction = ({ openAIApiKey, botId }: { openAIApiKey: string, botId: string }) => ApEmbeddings

let embeddingsFactory: EmbeddingsFunction = faissEmbedding

export const embeddings = {
    set(embeddings: EmbeddingsFunction) {
        embeddingsFactory = embeddings
    },
    create({ openAIApiKey, botId }: { botId: string, openAIApiKey: string }) {
        return embeddingsFactory({ openAIApiKey, botId })
    },
}

