import {
  AgentOutputField,
  AgentOutputFieldType,
  isNil,
  TASK_COMPLETION_TOOL_NAME,
  SeekPage,
  PopulatedFlow,
  McpTrigger,
  ExecuteToolResponse,
  ExecutionToolStatus,
  McpProperty,
  McpPropertyType,
  AgentFlowTool,
  AgentMcpTool,
  McpAuthConfig,
  McpAuthType,
  McpProtocol,
} from '@activepieces/shared';
import { experimental_createMCPClient as createMCPClient, MCPTransport } from '@ai-sdk/mcp';
import { z, ZodObject } from 'zod';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';


export const agentUtils = {
    isTaskCompletionToolCall: (toolName: string) => toolName === TASK_COMPLETION_TOOL_NAME,
    structuredOutputSchema(outputFields: AgentOutputField[]): ZodObject | undefined {
        const shape: Record<string, z.ZodType> = {};

        for (const field of outputFields) {
            switch (field.type) {
            case AgentOutputFieldType.TEXT:
                shape[field.displayName] = z.string();
                break;
            case AgentOutputFieldType.NUMBER:
                shape[field.displayName] = z.number();
                break;
            case AgentOutputFieldType.BOOLEAN:
                shape[field.displayName] = z.boolean();
                break;
            default:
                shape[field.displayName] = z.any();
            }
        }
        return Object.keys(shape).length > 0 ? z.object(shape) : undefined;
    },
    async constructMcpServersTools(
        tools: AgentMcpTool[]
    ): Promise<Record<string, unknown>> {
        const collected = [];

        for (const tool of tools) {
            try {
                const mcpClient = await createMCPClient({
                    transport: createTransportConfig(tool.protocol, tool.serverUrl, buildAuthHeaders(tool.auth))
                });

                const tools = await mcpClient.tools();
                collected.push({
                    mcpName: tool.toolName,
                    tools,
                });
            } catch (error) {
                console.error(`Failed to connect to MCP server ${tool.serverUrl}:`);
            }
        }

        return collected.reduce<Record<string, unknown>>(
            (acc, { mcpName, tools }) => {
                for (const [toolName, fn] of Object.entries(tools)) {
                    acc[`${toolName}_${mcpName}`] = fn;
                }

                return acc;
            },
            {}
        );
    },
    async constructFlowsTools(params: ConstructFlowsToolsParams) {
        const flowTools = params.tools
        const flowExternalIds = flowTools.map((tool) => tool.externalFlowId)
        const flows = await params.fetchFlows({ externalIds: flowExternalIds })

        const flowToolsWithPopulatedFlows = flowTools.map((tool) => {
            const populatedFlow = flows.data.find(f => f.externalId === tool.externalFlowId);
            return !isNil(populatedFlow) ? { ...tool, flow: populatedFlow } : undefined
        }).filter(tool => !isNil(tool));

        const flowsToolsList = await Promise.all(flowToolsWithPopulatedFlows.map(async (tool) => {
            const triggerSettings = tool.flow.version.trigger.settings as McpTrigger
            const toolDescription = triggerSettings.input?.toolDescription
            const returnsResponse = triggerSettings.input?.returnsResponse

            const inputSchema = Object.fromEntries(
                triggerSettings.input?.inputSchema.map(prop => [
                    fixProperty(prop.name),
                    mcpPropertyToSchema(prop),
                ]),
            )
            return {
                name: tool.toolName,
                description: toolDescription,
                inputSchema: z.object(inputSchema),
                execute: async (_inputs: unknown) => {
                    return callMcpFlowTool({
                        flowId: tool.flow.id,
                        publicUrl: params.publicUrl,
                        token: params.token,
                        async: !returnsResponse
                    }) 
                }
            }
        }))

        return {
            ...Object.fromEntries(flowsToolsList.map((tool) => [tool.name, tool])),
        }
    }

}
function isOkSuccess(status: number) {
    return Math.floor(status / 100) === 2
}

async function callMcpFlowTool(params: CallMcpFlowToolParams): Promise<ExecuteToolResponse> {
    const syncSuffix = params.async ? '' : '/sync';

    const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${params.publicUrl}v1/webhooks/${params.flowId}${syncSuffix}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: params.token,
        },
    });

    return {
        status: isOkSuccess(response.status) ? ExecutionToolStatus.SUCCESS : ExecutionToolStatus.FAILED,
        output: response.body,
        resolvedInput: {},
        errorMessage: !isOkSuccess(response.status) ? 'Error' : undefined,
    }
}

function fixProperty(schemaName: string) {
    return schemaName.replace(/[\s/@-]+/g, '_')
}

function mcpPropertyToSchema(property: McpProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case McpPropertyType.TEXT:
        case McpPropertyType.DATE:
            schema = z.string()
            break
        case McpPropertyType.NUMBER:
            schema = z.number()
            break
        case McpPropertyType.BOOLEAN:
            schema = z.boolean()
            break
        case McpPropertyType.ARRAY:
            schema = z.array(z.string())
            break
        case McpPropertyType.OBJECT:
            schema = z.record(z.string(), z.string())
            break
        default:
            schema = z.unknown()
    }

    if (property.description) {
        schema = schema.describe(property.description)
    }

    return property.required ? schema : schema.nullish()
}


type ConstructFlowsToolsParams = {
    tools: AgentFlowTool[]
    fetchFlows: (params: { externalIds: string[] }) => Promise<SeekPage<PopulatedFlow>>
    publicUrl: string;
    token: string
}

type CallMcpFlowToolParams = {
    flowId: string;
    token: string;
    publicUrl: string;
    async: boolean;
}


function buildAuthHeaders(authConfig: McpAuthConfig): Record<string, string> {
  let headers: Record<string, string> = {};

  switch (authConfig.type) {
    case McpAuthType.NONE:
      break;
    case McpAuthType.HEADERS: {
    headers = authConfig.headers
      break;
    }
    case McpAuthType.ACCESS_TOKEN: { 
      headers['Authorization'] = `Bearer ${authConfig.accessToken}`
      break;
    }
    case McpAuthType.API_KEY: {
      const headerName = authConfig.apiKeyHeader;
      headers[headerName] = authConfig.apiKey
      break;
    }
  }

  return headers;
}

function createTransportConfig(
  protocol: McpProtocol,
  serverUrl: string,
  headers: Record<string, string> = {}
): any {
  const url = new URL(serverUrl);

  switch (protocol) {
    case McpProtocol.SIMPLE_HTTP:
      return {
        type: 'http',
        url: serverUrl,
        headers: headers,
      };

    case McpProtocol.STREAMABLE_HTTP:
      const sessionId = crypto.randomUUID()
      return new StreamableHTTPClientTransport(url, {
        sessionId: sessionId,
        requestInit: {
            headers
        }
      })

    case McpProtocol.SSE:
      return {
        type: 'sse',
        url: serverUrl,
        headers: headers,
      };

    default:
      throw new Error(`Unsupported MCP protocol type: ${protocol}`);
  }
}