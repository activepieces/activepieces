import { AgentJobSource } from '@activepieces/server-shared'
import { Agent, agentbuiltInToolsNames, AgentOutputFieldType, AgentOutputType, Field, FieldType, isNil, McpWithTools } from '@activepieces/shared'
import { experimental_createMCPClient, tool } from 'ai'
import { z, ZodRawShape, ZodSchema } from 'zod'
import { tablesApiService } from '../api/server-api.service'

export const agentTools = async <T extends AgentJobSource>(params: AgentToolsParams<T>) => {
    const mcpClient = await getMcpClient(params)
    const builtInTools = await buildInternalTools(params)
    const mcpTools = isNil(await mcpClient?.tools()) ? {} : await mcpClient?.tools()
    const tools = {
        ...builtInTools,
        ...mcpTools,
    }
    
    return {
        tools: async () => {
            return tools
        },
        close: async () => {
            await mcpClient?.close()
        },
    }
}

async function buildInternalTools<T extends AgentJobSource>(params: AgentToolsParams<T>) {
    if (params.source === AgentJobSource.TABLE) {
        const fields = await tablesApiService(params.token).getFields(params.metadata!.tableId)
        return {
            [agentbuiltInToolsNames.updateTableRecord]: tool({
                description: 'Update the table record',
                parameters: z.object({
                    cells: createCellsZodSchema(fields),
                }),
                execute: async ({ cells }) => {
                    return tablesApiService(params.token).updateRecord(params.metadata!.recordId, {
                        cells,
                        tableId: params.metadata!.tableId,
                    })
                },
            }),
            [agentbuiltInToolsNames.markAsComplete]: tool({
                description: 'Mark the todo as complete',
                parameters: params.agent.outputType === AgentOutputType.STRUCTURED_OUTPUT ? z.object({
                    output: await getStructuredOutput(params.agent),
                }) : z.object({}),
                execute: async () => {
                    return 'Marked as Complete'
                },
            }),
        }
    }

    return {
        [agentbuiltInToolsNames.markAsComplete]: tool({
            description: 'Mark the todo as complete',
            parameters: params.agent.outputType === AgentOutputType.STRUCTURED_OUTPUT ? z.object({
                output: await getStructuredOutput(params.agent),
            }) : z.object({}),
            execute: async () => {
                return 'Marked as Complete'
            },
        }),
    }
}

function createCellsZodSchema(fields: Field[]): z.ZodSchema {
    if (fields.length === 0) {
        return z.array(z.object({
            fieldId: z.string(),
            value: z.any(),
        }))
    }

    const cellSchemas = fields.map(field => {
        let valueSchema: z.ZodType
        
        switch (field.type) {
            case FieldType.NUMBER: {
                valueSchema = z.union([
                    z.number(),
                    z.string().transform(val => {
                        const num = Number(val)
                        if (isNaN(num)) throw new Error(`Invalid number for field "${field.name}"`)
                        return num
                    }),
                ])
                break
            }
            case FieldType.DATE: {
                valueSchema = z.union([
                    z.date(),
                    z.string().transform(val => {
                        const date = new Date(val)
                        if (isNaN(date.getTime())) throw new Error(`Invalid date for field "${field.name}"`)
                        return date
                    }),
                ])
                break
            }
            case FieldType.STATIC_DROPDOWN: {
                const options = field.data.options.map(option => option.value)
                valueSchema = options.length > 0 
                    ? z.enum(options as [string, ...string[]])
                    : z.string()
                break
            }
            default: {
                // TEXT
                valueSchema = z.string()
                break
            }
        }
        
        return z.object({
            fieldId: z.literal(field.id),
            value: valueSchema,
        })
    })
    
    if (cellSchemas.length === 1) {
        return z.array(cellSchemas[0])
    }
    
    return z.array(z.union([cellSchemas[0], cellSchemas[1], ...cellSchemas.slice(2)]))
}


async function getMcpClient<T extends AgentJobSource>(params: AgentToolsParams<T>) {
    const mcpServer = params.mcp
    if (mcpServer.tools.length === 0) {
        return null
    }
    const mcpServerUrl = `${params.publicUrl}v1/mcp/${params.mcp.token}/sse`
    // console.log('MCP SERVER URL', mcpServerUrl)
    return experimental_createMCPClient({
        transport: {
            type: 'sse',
            url: mcpServerUrl,
        },
    })
}


async function getStructuredOutput(agent: Agent): Promise<ZodSchema> {
    const outputFields = agent.outputFields ?? []
    const shape: ZodRawShape = {}

    for (const field of outputFields) {
        switch (field.type) {
            case AgentOutputFieldType.TEXT:
                shape[field.displayName] = z.string()
                break
            case AgentOutputFieldType.NUMBER:
                shape[field.displayName] = z.number()
                break
            case AgentOutputFieldType.BOOLEAN:
                shape[field.displayName] = z.boolean()
                break
            default:
                shape[field.displayName] = z.any()
        }
    }

    return z.object(shape)
}   

type AgentToolsParams<T extends AgentJobSource> = {
    publicUrl: string
    token: string
    mcp: McpWithTools
    agent: Agent
    source: T
    metadata: T extends AgentJobSource.TABLE ? {
        tableId: string
        recordId: string
    } : undefined
}
