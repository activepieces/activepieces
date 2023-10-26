import { Document } from 'langchain/document'
import {
    QdrantVectorStore,
} from 'langchain/vectorstores/qdrant'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { ApEmbeddings } from '../../../chatbot/embedings'

async function getClient(openAiKey: string) {
    const qdrantClient = new QdrantVectorStore(new OpenAIEmbeddings({
        openAIApiKey: openAiKey,
    }), {
        url: system.get(SystemProp.QDRANT_CLUSTER_URL),
        apiKey: system.get(SystemProp.QRDANT_CLOUD_API_KEY),
    })

    return qdrantClient
}

export const qdrantEmbeddings = ({ openAIApiKey, botId }: { botId: string, openAIApiKey: string }): ApEmbeddings => ({
    async query({ input }: { input: string }) {
        const vectorStore = await getClient(openAIApiKey)
        const results = await vectorStore.similaritySearch(input, 3, {
            'must': [{
                'key': 'metadata.botId',
                'match': {
                    'value': botId,
                },
            }],
        })
        return results.map((f) => f.pageContent)
    },
    async addDocuments({
        botId,
        datasourceId,
        documents,
    }: {
        botId: string
        datasourceId: string
        documents: Document[]
    }) {
        const vectorStore = await getClient(openAIApiKey)
        await vectorStore.addDocuments(documents.map((f) => {
            return {
                pageContent: f.pageContent,
                metadata: {
                    datasourceId,
                    botId,
                },
            }
        }))
    },
    async deleteDocuments({ datasourceId }: { datasourceId: string }) {
        const vectoreStore = await getClient(openAIApiKey)
        await vectoreStore.client.delete('documents', {
            filter: {
                'must': [{
                    'key': 'metadata.datasourceId',
                    'match': {
                        'value': datasourceId,
                    },
                }],
            },
        })

    },
})
