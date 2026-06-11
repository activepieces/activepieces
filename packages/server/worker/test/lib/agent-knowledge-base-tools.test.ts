import { AgentKnowledgeBaseTool, AgentToolType, KnowledgeBaseSourceType, WorkerToApiContract } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('ai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('ai')>()
    return {
        ...actual,
        embed: vi.fn(async () => ({ embedding: [0.3, 0.4] })),
        embedMany: vi.fn(async () => ({ embeddings: [[0.1, 0.2]] })),
    }
})

const { buildKnowledgeBaseTools } = await import('../../src/lib/ai/agent/tools/knowledge-base-tools')

const fileTool: AgentKnowledgeBaseTool = {
    type: AgentToolType.KNOWLEDGE_BASE,
    toolName: 'kb_docs',
    sourceType: KnowledgeBaseSourceType.FILE,
    sourceId: 'file-1',
    sourceName: 'Docs',
}

const tableTool: AgentKnowledgeBaseTool = {
    type: AgentToolType.KNOWLEDGE_BASE,
    toolName: 'kb_table',
    sourceType: KnowledgeBaseSourceType.TABLE,
    sourceId: 'table-1',
    sourceName: 'Customers',
}

function makeApiClient(overrides: Partial<WorkerToApiContract> = {}): WorkerToApiContract {
    return {
        listKnowledgeChunks: vi.fn().mockResolvedValue([{ id: 'c1', content: 'hello world', chunkIndex: 0 }]),
        storeKnowledgeChunks: vi.fn().mockResolvedValue(undefined),
        searchKnowledge: vi.fn().mockResolvedValue([{ id: 'c1', content: 'result text', metadata: { fileName: 'Docs.pdf' }, chunkIndex: 0, score: 0.91 }]),
        getTableSchema: vi.fn().mockResolvedValue({ id: 'table-1', name: 'Customers', fields: [{ id: 'f1', name: 'Email', type: 'TEXT' }] }),
        listTableRecords: vi.fn().mockResolvedValue({ records: [{ id: 'r1' }] }),
        ...overrides,
    } as unknown as WorkerToApiContract
}

const makeLogger = () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() } as unknown as Parameters<typeof buildKnowledgeBaseTools>[0]['log'])
const embeddingConfig = { model: {}, providerOptions: {} } as unknown as Parameters<typeof buildKnowledgeBaseTools>[0]['embeddingConfig']

describe('buildKnowledgeBaseTools', () => {
    beforeEach(() => vi.clearAllMocks())

    it('embeds pending chunks then exposes a search tool for file sources', async () => {
        const apiClient = makeApiClient()
        const { tools, toolKeyToAgentTool } = await buildKnowledgeBaseTools({ kbTools: [fileTool], apiClient, engineToken: 'engine-token', embeddingConfig, log: makeLogger() })

        expect(apiClient.listKnowledgeChunks).toHaveBeenCalledWith({ engineToken: 'engine-token', knowledgeBaseFileId: 'file-1', embedded: false })
        expect(apiClient.storeKnowledgeChunks).toHaveBeenCalledWith({ engineToken: 'engine-token', knowledgeBaseFileId: 'file-1', chunks: [{ id: 'c1', embedding: [0.1, 0.2] }] })
        expect(tools['search_knowledge_base']).toBeDefined()
        expect(toolKeyToAgentTool['search_knowledge_base']).toEqual(fileTool)
    })

    it('search tool embeds the query and maps results', async () => {
        const apiClient = makeApiClient()
        const { tools } = await buildKnowledgeBaseTools({ kbTools: [fileTool], apiClient, engineToken: 'engine-token', embeddingConfig, log: makeLogger() })

        const output = await tools['search_knowledge_base'].execute!({ query: 'what is x' }, { toolCallId: 't1', messages: [] })

        expect(apiClient.searchKnowledge).toHaveBeenCalledWith({ engineToken: 'engine-token', knowledgeBaseFileIds: ['file-1'], queryEmbedding: [0.3, 0.4], limit: 5, similarityThreshold: 0.5 })
        expect(output).toEqual({ results: [{ rank: 1, content: 'result text', source: 'Docs.pdf', relevanceScore: 0.91 }] })
    })

    it('skips file search when no embedding model is available', async () => {
        const apiClient = makeApiClient()
        const { tools } = await buildKnowledgeBaseTools({ kbTools: [fileTool], apiClient, engineToken: 'engine-token', embeddingConfig: undefined, log: makeLogger() })

        expect(tools['search_knowledge_base']).toBeUndefined()
        expect(apiClient.listKnowledgeChunks).not.toHaveBeenCalled()
    })

    it('resolves table field names to ids when querying records', async () => {
        const apiClient = makeApiClient()
        const { tools } = await buildKnowledgeBaseTools({ kbTools: [tableTool], apiClient, engineToken: 'engine-token', embeddingConfig, log: makeLogger() })

        expect(apiClient.getTableSchema).toHaveBeenCalledWith({ engineToken: 'engine-token', tableId: 'table-1' })

        const toolName = Object.keys(tools).find((key) => key !== 'search_knowledge_base')!
        const output = await tools[toolName].execute!({ filters: [{ fieldName: 'email', operator: 'eq', value: 'a@b.com' }], limit: 7 }, { toolCallId: 't1', messages: [] })

        expect(apiClient.listTableRecords).toHaveBeenCalledWith({
            engineToken: 'engine-token',
            tableId: 'table-1',
            filters: [{ fieldId: 'f1', operator: 'eq', value: 'a@b.com' }],
            limit: 7,
        })
        expect(output).toEqual({ records: [{ id: 'r1' }], count: 1 })
    })

    it('drops filters that reference unknown fields', async () => {
        const apiClient = makeApiClient()
        const { tools } = await buildKnowledgeBaseTools({ kbTools: [tableTool], apiClient, engineToken: 'engine-token', embeddingConfig, log: makeLogger() })

        const toolName = Object.keys(tools).find((key) => key !== 'search_knowledge_base')!
        await tools[toolName].execute!({ filters: [{ fieldName: 'nonexistent', operator: 'eq', value: 'x' }] }, { toolCallId: 't1', messages: [] })

        expect(apiClient.listTableRecords).toHaveBeenCalledWith(expect.objectContaining({ filters: [] }))
    })
})
