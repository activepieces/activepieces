import {
    AgentKnowledgeBaseTool,
    AgentTool,
    Filter,
    FilterOperator,
    isNil,
    KnowledgeBaseSourceType,
    mcpToolNameUtils,
    WorkerToApiContract,
} from '@activepieces/shared'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { dynamicTool, embed, EmbeddingModel, embedMany, Tool, ToolSet } from 'ai'
import { Logger } from 'pino'
import { z } from 'zod'

const SEARCH_KNOWLEDGE_BASE_TOOL_NAME = 'search_knowledge_base'
const EMBED_BATCH_SIZE = 50
const SEARCH_LIMIT = 5
const SEARCH_SIMILARITY_THRESHOLD = 0.5
const RECORD_QUERY_DEFAULT_LIMIT = 10

/**
 * Worker-side port of the AI piece's `constructKnowledgeBaseTools`. File-source tools embed any
 * not-yet-embedded chunks at construction time, then expose a similarity-search tool; table-source
 * tools resolve their schema once and expose a record-query tool. All internal-API access goes
 * through the worker→API RPC client (the worker has no HTTP client to the API), authorized by the
 * engine token; the embedding model runs against the AI provider directly.
 */
export async function buildKnowledgeBaseTools({ kbTools, apiClient, engineToken, embeddingConfig, log }: BuildKnowledgeBaseToolsParams): Promise<BuiltKnowledgeBaseTools> {
    const tools: ToolSet = {}
    const toolKeyToAgentTool: Record<string, AgentTool> = {}

    const fileTools = kbTools.filter((tool) => tool.sourceType === KnowledgeBaseSourceType.FILE)
    const tableTools = kbTools.filter((tool) => tool.sourceType === KnowledgeBaseSourceType.TABLE)

    if (fileTools.length > 0 && !isNil(embeddingConfig)) {
        await embedPendingChunks({ fileTools, apiClient, engineToken, embeddingConfig, log })
        tools[SEARCH_KNOWLEDGE_BASE_TOOL_NAME] = buildSearchTool({ fileTools, apiClient, engineToken, embeddingConfig })
        toolKeyToAgentTool[SEARCH_KNOWLEDGE_BASE_TOOL_NAME] = fileTools[0]
    }

    const tableToolEntries = await Promise.all(tableTools.map((tableTool) => buildTableTool({ tableTool, apiClient, engineToken, log })))
    for (const { toolName, tool, agentTool } of tableToolEntries) {
        tools[toolName] = tool
        toolKeyToAgentTool[toolName] = agentTool
    }

    return { tools, toolKeyToAgentTool }
}

async function embedPendingChunks({ fileTools, apiClient, engineToken, embeddingConfig, log }: EmbedPendingChunksParams): Promise<void> {
    for (const fileTool of fileTools) {
        try {
            const unembedded = await apiClient.listKnowledgeChunks({ engineToken, knowledgeBaseFileId: fileTool.sourceId, embedded: false })
            for (let i = 0; i < unembedded.length; i += EMBED_BATCH_SIZE) {
                const batch = unembedded.slice(i, i + EMBED_BATCH_SIZE)
                const { embeddings } = await embedMany({
                    model: embeddingConfig.model,
                    values: batch.map((chunk) => chunk.content),
                    providerOptions: embeddingConfig.providerOptions,
                })
                await apiClient.storeKnowledgeChunks({
                    engineToken,
                    knowledgeBaseFileId: fileTool.sourceId,
                    chunks: batch.map((chunk, j) => ({ id: chunk.id, embedding: Array.from(embeddings[j]) })),
                })
            }
        }
        catch (error) {
            log.warn({ err: error, knowledgeBaseFileId: fileTool.sourceId }, '[knowledgeBaseTools] Failed to embed knowledge base file')
        }
    }
}

function buildSearchTool({ fileTools, apiClient, engineToken, embeddingConfig }: BuildSearchToolParams): Tool {
    const fileIds = fileTools.map((tool) => tool.sourceId)
    const sourceNames = fileTools.map((tool) => tool.sourceName).join(', ')
    return dynamicTool({
        description: `Search uploaded documents for relevant information. Available documents: ${sourceNames}. Use when you need facts, policies, or content from these knowledge base files.`,
        inputSchema: z.object({ query: z.string().describe('Search query to find relevant information') }),
        execute: async (input) => {
            const query = readString(input, 'query')
            const { embedding } = await embed({ model: embeddingConfig.model, value: query, providerOptions: embeddingConfig.providerOptions })
            const results = await apiClient.searchKnowledge({
                engineToken,
                knowledgeBaseFileIds: fileIds,
                queryEmbedding: Array.from(embedding),
                limit: SEARCH_LIMIT,
                similarityThreshold: SEARCH_SIMILARITY_THRESHOLD,
            })
            if (results.length === 0) {
                return { results: 'No relevant information found.' }
            }
            return {
                results: results.map((result, index) => ({
                    rank: index + 1,
                    content: result.content,
                    source: typeof result.metadata['fileName'] === 'string' ? result.metadata['fileName'] : 'unknown',
                    relevanceScore: result.score,
                })),
            }
        },
    })
}

async function buildTableTool({ tableTool, apiClient, engineToken, log }: BuildTableToolParams): Promise<TableToolEntry> {
    const toolName = mcpToolNameUtils.createToolName(`query_table_${tableTool.toolName}`)
    let fieldNameToId = new Map<string, string>()
    let fieldDescriptions = ''
    try {
        const schema = await apiClient.getTableSchema({ engineToken, tableId: tableTool.sourceId })
        fieldNameToId = new Map(schema.fields.map((field) => [field.name.toLowerCase(), field.id]))
        fieldDescriptions = schema.fields.map((field) => `${field.name} (${field.type})`).join(', ')
    }
    catch (error) {
        log.warn({ err: error, tableId: tableTool.sourceId }, '[knowledgeBaseTools] Failed to fetch table schema')
    }

    const tool = dynamicTool({
        description: `Query the '${tableTool.sourceName}' data table.${fieldDescriptions ? ` Columns: ${fieldDescriptions}.` : ''} Use to look up records or find specific entries.`,
        inputSchema: z.object({
            filters: z.array(z.object({
                fieldName: z.string().describe('The name of the field to filter on'),
                operator: z.enum(FilterOperator).describe('Filter operator'),
                value: z.string().optional().describe('The value to filter by'),
            })).optional().describe('Optional filters to narrow results'),
            limit: z.number().optional().default(RECORD_QUERY_DEFAULT_LIMIT).describe('Maximum number of records to return'),
        }),
        execute: async (input) => {
            const { filters, limit } = parseRecordQuery(input)
            const resolvedFilters = filters.flatMap((filter) => {
                const fieldId = fieldNameToId.get(filter.fieldName.toLowerCase())
                return isNil(fieldId) ? [] : [toFilter({ fieldId, operator: filter.operator, value: filter.value ?? '' })]
            })
            const { records } = await apiClient.listTableRecords({ engineToken, tableId: tableTool.sourceId, filters: resolvedFilters, limit })
            return { records, count: records.length }
        },
    })

    return { toolName, tool, agentTool: tableTool }
}

function toFilter({ fieldId, operator, value }: { fieldId: string, operator: FilterOperator, value: string }): Filter {
    switch (operator) {
        case FilterOperator.EQ: return { fieldId, operator, value }
        case FilterOperator.NEQ: return { fieldId, operator, value }
        case FilterOperator.GT: return { fieldId, operator, value }
        case FilterOperator.GTE: return { fieldId, operator, value }
        case FilterOperator.LT: return { fieldId, operator, value }
        case FilterOperator.LTE: return { fieldId, operator, value }
        case FilterOperator.CO: return { fieldId, operator, value }
        case FilterOperator.EXISTS: return { fieldId, operator }
        case FilterOperator.NOT_EXISTS: return { fieldId, operator }
    }
}

function parseRecordQuery(input: unknown): { filters: RecordQueryFilter[], limit: number } {
    if (!isRecord(input)) {
        return { filters: [], limit: RECORD_QUERY_DEFAULT_LIMIT }
    }
    const rawFilters = Array.isArray(input['filters']) ? input['filters'] : []
    const filters = rawFilters.flatMap((raw) => isRecord(raw) && typeof raw['fieldName'] === 'string' && isFilterOperator(raw['operator'])
        ? [{ fieldName: raw['fieldName'], operator: raw['operator'], value: typeof raw['value'] === 'string' ? raw['value'] : undefined }]
        : [])
    const limit = typeof input['limit'] === 'number' ? input['limit'] : RECORD_QUERY_DEFAULT_LIMIT
    return { filters, limit }
}

function isFilterOperator(value: unknown): value is FilterOperator {
    return typeof value === 'string' && Object.values(FilterOperator).some((operator) => operator === value)
}

function readString(input: unknown, key: string): string {
    if (isRecord(input) && typeof input[key] === 'string') {
        return input[key]
    }
    return ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && !isNil(value) && !Array.isArray(value)
}

type EmbeddingConfig = {
    model: EmbeddingModel
    providerOptions: SharedV3ProviderOptions
}

type RecordQueryFilter = {
    fieldName: string
    operator: FilterOperator
    value: string | undefined
}

type TableToolEntry = {
    toolName: string
    tool: Tool
    agentTool: AgentKnowledgeBaseTool
}

type BuildKnowledgeBaseToolsParams = {
    kbTools: AgentKnowledgeBaseTool[]
    apiClient: WorkerToApiContract
    engineToken: string
    embeddingConfig: EmbeddingConfig | undefined
    log: Logger
}

type EmbedPendingChunksParams = {
    fileTools: AgentKnowledgeBaseTool[]
    apiClient: WorkerToApiContract
    engineToken: string
    embeddingConfig: EmbeddingConfig
    log: Logger
}

type BuildSearchToolParams = {
    fileTools: AgentKnowledgeBaseTool[]
    apiClient: WorkerToApiContract
    engineToken: string
    embeddingConfig: EmbeddingConfig
}

type BuildTableToolParams = {
    tableTool: AgentKnowledgeBaseTool
    apiClient: WorkerToApiContract
    engineToken: string
    log: Logger
}

export type BuiltKnowledgeBaseTools = {
    tools: ToolSet
    toolKeyToAgentTool: Record<string, AgentTool>
}
