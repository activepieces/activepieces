import { FaissStore } from 'langchain/vectorstores/faiss'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { Document } from 'langchain/document'
import path from 'path'
import fs from 'fs/promises'
import { localFileStore } from '../../helper/store'
import { EMBEDINGS_SEARCH_RESULT } from './embedings-settings'

const storeCache: Record<string, FaissStore> = {}

function getStorePath(botId: string) {
    return path.join(localFileStore.getStorePath(), botId)
}

function getEmbedding(openAIApiKey: string) {
    return new OpenAIEmbeddings({
        openAIApiKey,
    })
}

async function getStore({ botId, openAIApiKey }: { botId: string, openAIApiKey: string }) {
    if (storeCache[botId]) {
        return storeCache[botId]
    }
    const dir = getStorePath(botId)
    try {
        await fs.access(dir)
        const store = await FaissStore.load(dir, getEmbedding(openAIApiKey))
        storeCache[botId] = store
        return store
    }
    catch (error) {
        const store = await FaissStore.fromDocuments([], getEmbedding(openAIApiKey))
        storeCache[botId] = store
        return store
    }
}

export const faissEmbedding = ({ openAIApiKey, botId }: { botId: string, openAIApiKey: string }) => ({
    async query({ input }: { input: string }) {
        const store = await getStore({ botId, openAIApiKey })
        if (store.docstore._docs.size === 0) {
            return []
        }
        const similarDocuments = await store.similaritySearch(input, EMBEDINGS_SEARCH_RESULT, botId)
        return similarDocuments.map((doc) => doc.pageContent)
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
        const store = await getStore({
            botId,
            openAIApiKey,
        })
        const dir = getStorePath(botId)
        const modifiedDocument = documents.map((f) => {
            return {
                ...f,
                metadata: {
                    ...f.metadata,
                    datasourceId,
                },
            }
        })
        await store.addDocuments(modifiedDocument)
        await store.save(dir)
        delete storeCache[botId]
    },
    async deleteDocuments({ datasourceId }: { datasourceId: string }) {
        const store = await getStore({
            botId,
            openAIApiKey,
        })
        const dir = getStorePath(botId)
        const documentsToKeep: Document[] = []
        store.docstore._docs.forEach((doc) => {
            if (doc.metadata.datasourceId !== datasourceId) {
                documentsToKeep.push(doc)
            }
        })
        if (documentsToKeep.length === 0) {
            await fs.rmdir(dir, { recursive: true })
        }
        else {
            const newStore = await FaissStore.fromDocuments(
                documentsToKeep,
                getEmbedding(openAIApiKey),
            )
            await newStore.save(dir)
        }
        delete storeCache[botId]
    },
})