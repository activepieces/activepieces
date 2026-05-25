import { dynamicTool, embed, embedMany, EmbeddingModel, LanguageModel, Tool } from "ai";
import z from "zod";
import { agentUtils } from "./utils";
import { agentOutputBuilder } from "./agent-output-builder";
import { AgentKnowledgeBaseTool, AgentMcpTool, AgentOutputField, AgentTaskStatus, AgentTool, AgentToolType, buildAuthHeaders, isNil, isString, KnowledgeBaseSourceType, McpProtocol, mcpToolNameUtils, TASK_COMPLETION_TOOL_NAME } from "@activepieces/shared";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { ActionContext } from "@activepieces/pieces-framework";
import { ProviderOptions } from "@ai-sdk/provider-utils";
import { experimental_createMCPClient as createMCPClient, MCPClient, MCPTransport } from '@ai-sdk/mcp';
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";

function createTransportConfig(
    protocol: McpProtocol,
    serverUrl: string,
    headers: Record<string, string> = {},
) {
    const url = new URL(serverUrl)

    switch (protocol) {
        case McpProtocol.SIMPLE_HTTP: {
            return {
                type: 'http',
                url: serverUrl,
                headers,
            }
        }
        case McpProtocol.STREAMABLE_HTTP: {
            return new StreamableHTTPClientTransport(url, {
                requestInit: {
                    headers,
                },
            })
        }
        case McpProtocol.SSE: {
            return {
                type: 'sse',
                url: serverUrl,
                headers,
            }
        }
        default:
            throw new Error(`Unsupported MCP protocol type: ${protocol}`)
    }
}

const SEARCH_KNOWLEDGE_BASE_TOOL_NAME = 'search_knowledge_base'

function flattenMcpServers(
    servers: McpServerTools[],
    agentMcpTools: AgentMcpTool[],
  ): FlattenedMcpResult {
    const mcpClients: MCPClient[] = [];
    const tools: Record<string, Tool> = {};
    const keyToAgentTool: Record<string, AgentMcpTool> = {};

    for (const server of servers) {
      mcpClients.push(server.mcpClient);
      const agentTool = agentMcpTools.find((t) => t.toolName === server.mcpName);

      for (const [toolName, fn] of Object.entries(server.tools)) {
        const key = mcpToolNameUtils.createToolName(`${toolName}`);
        tools[key] = fn;
        if (agentTool) {
          keyToAgentTool[key] = agentTool;
        }
      }
    }

    return { mcpClients, tools, keyToAgentTool };
}

async function constructMcpServersTools(
    tools: AgentMcpTool[]
  ): Promise<McpServerTools[]> {
    const collected: McpServerTools[] = [];

    for (const tool of tools) {
      try {
        const mcpClient = await createMCPClient({
          transport: createTransportConfig(
            tool.protocol,
            tool.serverUrl,
            buildAuthHeaders(tool.auth)
          ) as MCPTransport,
        });

        const mcpTools = await mcpClient.tools();

        collected.push({
          mcpName: tool.toolName,
          mcpClient,
          tools: mcpTools as Record<string, Tool>,
        });
      } catch (error) {
        console.error(
          `Failed to connect to MCP server ${tool.serverUrl}:`,
          error
        );
      }
    }

    return collected;
  }

function createServerApiClient(context: ActionContext) {
    return {
        get<T = unknown>(path: string, queryParams?: Record<string, string>) {
            return httpClient.sendRequest<T>({
                method: HttpMethod.GET,
                url: `${context.server.apiUrl}${path}`,
                ...(queryParams ? { queryParams } : {}),
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: context.server.token,
                },
            })
        },
        post<T = unknown>(path: string, body: unknown) {
            return httpClient.sendRequest<T>({
                method: HttpMethod.POST,
                url: `${context.server.apiUrl}${path}`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: context.server.token,
                },
                body,
            })
        },
    }
}

async function constructKnowledgeBaseTools(
    kbTools: AgentKnowledgeBaseTool[],
    context: ActionContext,
    embeddingConfig: EmbeddingConfig | undefined,
): Promise<{ tools: Record<string, Tool>, keyToAgentTool: Record<string, AgentKnowledgeBaseTool> }> {
    const tools: Record<string, Tool> = {}
    const keyToAgentTool: Record<string, AgentKnowledgeBaseTool> = {}
    const api = createServerApiClient(context)

    const fileTools = kbTools.filter(t => t.sourceType === KnowledgeBaseSourceType.FILE)
    const tableTools = kbTools.filter(t => t.sourceType === KnowledgeBaseSourceType.TABLE)

    if (fileTools.length > 0 && embeddingConfig) {
        const fileIds = fileTools.map(t => t.sourceId)
        const sourceNames = fileTools.map(t => t.sourceName).join(', ')

        for (const fileTool of fileTools) {
            try {
                const unembeddedRes = await api.get<{ id: string, content: string, chunkIndex: number }[]>(
                    `v1/knowledge-base/files/${fileTool.sourceId}/chunks?embedded=false`,
                )
                const unembedded = unembeddedRes.body
                if (unembedded.length > 0) {
                    const EMBED_BATCH_SIZE = 50
                    for (let i = 0; i < unembedded.length; i += EMBED_BATCH_SIZE) {
                        const batch = unembedded.slice(i, i + EMBED_BATCH_SIZE)
                        const { embeddings } = await embedMany({
                            model: embeddingConfig.model,
                            values: batch.map(c => c.content),
                            providerOptions: embeddingConfig.providerOptions,
                        })
                        await api.post(`v1/knowledge-base/files/${fileTool.sourceId}/store-chunks`, {
                            chunks: batch.map((c, j) => ({
                                id: c.id,
                                embedding: Array.from(embeddings[j]),
                            })),
                        })
                    }
                }
            }
            catch (error) {
                console.error(`Failed to embed KB file '${fileTool.sourceName}':`, error)
            }
        }

        tools[SEARCH_KNOWLEDGE_BASE_TOOL_NAME] = dynamicTool({
            description: `Search uploaded documents for relevant information. Available documents: ${sourceNames}. Use when you need facts, policies, or content from these knowledge base files.`,
            inputSchema: z.object({
                query: z.string().describe('Search query to find relevant information'),
            }),
            execute: async (input) => {
                const { query } = input as { query: string }
                const { embedding } = await embed({
                    model: embeddingConfig.model,
                    value: query,
                    providerOptions: embeddingConfig.providerOptions,
                })

                const response = await api.post<SearchResultItem[]>('v1/knowledge-base/files/search', {
                    knowledgeBaseFileIds: fileIds,
                    queryEmbedding: Array.from(embedding),
                    limit: 5,
                    similarityThreshold: 0.5,
                })

                const results = response.body
                if (!results || results.length === 0) {
                    return { results: 'No relevant information found.' }
                }

                return {
                    results: results.map((r, i) => ({
                        rank: i + 1,
                        content: r.content,
                        source: r.metadata?.['fileName'] ?? 'unknown',
                        relevanceScore: r.score,
                    })),
                }
            },
        })
        keyToAgentTool[SEARCH_KNOWLEDGE_BASE_TOOL_NAME] = fileTools[0]
    }

    const tableToolEntries = await Promise.all(tableTools.map(async (tableTool) => {
        const toolName = mcpToolNameUtils.createToolName(`query_table_${tableTool.toolName}`)

        // Resolve table ID and fields once at construction time, cache for execution
        let cachedTableId: string | undefined
        let cachedFields: FieldInfo[] = []
        let fieldDescriptions = ''
        try {
            const tableResponse = await api.get<{ id: string, name: string }>(`v1/tables/${encodeURIComponent(tableTool.sourceId)}`)
            if (tableResponse.body.id) {
                cachedTableId = tableResponse.body.id
                const fieldsResponse = await api.get<FieldInfo[]>(`v1/fields?tableId=${cachedTableId}`)
                cachedFields = fieldsResponse.body
                fieldDescriptions = cachedFields.map(f => `${f.name} (${f.type})`).join(', ')
            }
        }
        catch (error) {
            console.error(`Failed to fetch table metadata for '${tableTool.sourceName}':`, error)
        }

        const tool = dynamicTool({
            description: `Query the '${tableTool.sourceName}' data table.${fieldDescriptions ? ` Columns: ${fieldDescriptions}.` : ''} Use to look up records or find specific entries.`,
            inputSchema: z.object({
                filters: z.array(z.object({
                    fieldName: z.string().describe('The name of the field to filter on'),
                    operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'co', 'exists', 'not_exists']).describe('Filter operator'),
                    value: z.string().optional().describe('The value to filter by'),
                })).optional().describe('Optional filters to narrow results'),
                limit: z.number().optional().default(10).describe('Maximum number of records to return'),
            }),
            execute: async (input) => {
                const { filters, limit } = input as { filters?: { fieldName: string, operator: string, value?: string }[], limit?: number }
                if (!cachedTableId) {
                    return { error: `Table '${tableTool.sourceName}' not found` }
                }

                // Use cached fields to resolve field names to IDs
                let resolvedFilters: { fieldId: string, operator: string, value?: string }[] | undefined
                if (filters && filters.length > 0) {
                    const fieldMap = new Map(cachedFields.map(f => [f.name.toLowerCase(), f.id]))
                    resolvedFilters = filters.flatMap(f => {
                        const fieldId = fieldMap.get(f.fieldName.toLowerCase())
                        if (!fieldId) return []
                        return [{ fieldId, operator: f.operator, value: f.value }]
                    })
                }

                const queryParams: Record<string, string> = {
                    tableId: cachedTableId,
                    limit: String(limit ?? 10),
                    ...serializeArrayQuery('filters', resolvedFilters ?? []),
                }

                const response = await api.get<{ data: unknown[] }>('v1/records', queryParams)
                const records = response.body.data
                return { records, count: records.length }
            },
        })

        return { toolName, tool, agentTool: tableTool }
    }))

    for (const { toolName, tool, agentTool } of tableToolEntries) {
        tools[toolName] = tool
        keyToAgentTool[toolName] = agentTool
    }

    return { tools, keyToAgentTool }
}

export async function constructAgentTools(
  params: ConstructAgentToolParams
): Promise<{ tools: Record<string, Tool>, mcpClients: MCPClient[], toolKeyToAgentTool: Record<string, AgentTool> }> {

    const { outputBuilder, structuredOutput, agentTools, context, model, embeddingConfig } = params;
    const agentPieceTools = await context.agent.tools({
      tools: agentTools.filter(tool => tool.type === AgentToolType.PIECE),
      model: model,
    });
    const flowsTools = await agentUtils.constructFlowsTools({
      tools: agentTools.filter(tool => tool.type === AgentToolType.FLOW),
      fetchFlows: context.flows.list,
      publicUrl: context.server.publicUrl,
      token: context.server.token
    })
    const agentMcpTools = agentTools.filter((tool): tool is AgentMcpTool => tool.type === AgentToolType.MCP);
    const mcpServerTools = await constructMcpServersTools(agentMcpTools)
    const { mcpClients, tools: mcpTools, keyToAgentTool: mcpKeyToAgentTool } = flattenMcpServers(mcpServerTools, agentMcpTools)

    const agentKbTools = agentTools.filter((tool): tool is AgentKnowledgeBaseTool => tool.type === AgentToolType.KNOWLEDGE_BASE);
    const { tools: kbTools, keyToAgentTool: kbKeyToAgentTool } = await constructKnowledgeBaseTools(agentKbTools, context, embeddingConfig)

    const combinedTools = {
      ...agentPieceTools,
      ...flowsTools,
      ...mcpTools,
      ...kbTools,
    };

    const toolKeyToAgentTool: Record<string, AgentTool> = {};
    for (const agentTool of agentTools.filter(t => t.type !== AgentToolType.MCP && t.type !== AgentToolType.KNOWLEDGE_BASE)) {
      const key = agentTool.type === AgentToolType.FLOW ? mcpToolNameUtils.createToolName(agentTool.toolName) : agentTool.toolName;
      toolKeyToAgentTool[key] = agentTool;
    }
    Object.assign(toolKeyToAgentTool, mcpKeyToAgentTool);
    Object.assign(toolKeyToAgentTool, kbKeyToAgentTool);

    const completionTool: Record<string, Tool> = {
        [TASK_COMPLETION_TOOL_NAME]: dynamicTool({
          description:
            "This tool must be called as your FINAL ACTION to indicate whether the assigned goal was accomplished. Call it only when you have completed the user's task, or if you are unable to continue. Once you call this tool, you should not take any further actions.",
          inputSchema: z.object({
            success: z
              .boolean()
              .describe(
                'Set to true if the assigned goal was achieved, or false if the task was abandoned or failed.'
              ),
            ...(!isNil(structuredOutput)
              ? {
                  output: z
                    .object(
                      agentUtils.structuredOutputSchema(structuredOutput)?.shape ?? {}
                    )
                    .nullable()
                    .describe(
                      'The structured output of your task. This is optional and can be omitted if you have not achieved the goal.'
                    ),
                }
              : {
                  output: z
                    .string()
                    .describe(
                      'Your complete response to the user. Always populate this with the full answer, result, or explanation — even if you already wrote text above. This is the final message that will be shown to the user.'
                    ),
                }),
          }),
          execute: async (params) => {
            const { success, output } = params as {
              success: boolean;
              output?: Record<string, unknown> | string;
            };
            outputBuilder.setStatus(
              success ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED
            );
            if (!isNil(structuredOutput) && !isNil(output) && !isString(output)) {
              outputBuilder.setStructuredOutput(output);
            } else if (isNil(structuredOutput) && !isNil(output) && !outputBuilder.hasTextContent()) {
              outputBuilder.addMarkdown(output as string);
            }
            return {};
          },
        }),
    }

    return {
        mcpClients,
        toolKeyToAgentTool,
        tools: {
            ...combinedTools,
            ...completionTool,
        },
    }
}

type ConstructAgentToolParams = {
  outputBuilder: ReturnType<typeof agentOutputBuilder>;
  structuredOutput?: AgentOutputField[];
  agentTools: AgentTool[];
  context: ActionContext
  model: LanguageModel
  embeddingConfig?: EmbeddingConfig
};

type FlattenedMcpResult = {
  mcpClients: MCPClient[];
  tools: Record<string, Tool>;
  keyToAgentTool: Record<string, AgentMcpTool>;
};

function serializeArrayQuery(key: string, items: Record<string, string | undefined>[]): Record<string, string> {
    const params: Record<string, string> = {}
    items.forEach((item, i) => {
        for (const [field, value] of Object.entries(item)) {
            if (value !== undefined) params[`${key}[${i}][${field}]`] = value
        }
    })
    return params
}

type FieldInfo = { id: string, name: string, type: string }
type EmbeddingConfig = {
    model: EmbeddingModel
    providerOptions: ProviderOptions
}

type SearchResultItem = { content: string, metadata: Record<string, unknown>, score: number }

export type McpServerTools = {
    mcpName: string
    mcpClient: MCPClient
    tools: Record<string, Tool>
}