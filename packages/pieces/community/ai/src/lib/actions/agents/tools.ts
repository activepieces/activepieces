import { dynamicTool, LanguageModel, Tool } from "ai";
import z from "zod";
import { agentUtils } from "./utils";
import { agentOutputBuilder } from "./agent-output-builder";
import { AgentMcpTool, AgentOutputField, AgentTaskStatus, AgentTool, AgentToolType, buildAuthHeaders, isNil, isString, McpProtocol, TASK_COMPLETION_TOOL_NAME } from "@activepieces/shared";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { ActionContext } from "@activepieces/pieces-framework";
import { experimental_createMCPClient as createMCPClient, MCPClient, MCPTransport } from '@ai-sdk/mcp';

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

export function sanitizeToolName(name: string): string {
  return String(name).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 128);
}

type FlattenedMcpResult = {
  mcpClients: MCPClient[];
  tools: Record<string, Tool>;
  keyToAgentTool: Record<string, AgentMcpTool>;
};

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
        const key = sanitizeToolName(`${toolName}_${server.mcpName}`);
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

export async function constructAgentTools(
  params: ConstructAgentToolParams
): Promise<{ tools: Record<string, Tool>, mcpClients: MCPClient[], toolKeyToAgentTool: Record<string, AgentTool> }> {

    const { outputBuilder, structuredOutput, agentTools, context, model } = params;
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

    const combinedTools = {
      ...agentPieceTools,
      ...flowsTools,
      ...mcpTools,
    };

    const toolKeyToAgentTool: Record<string, AgentTool> = {};
    for (const agentTool of agentTools.filter(t => t.type !== AgentToolType.MCP)) {
      toolKeyToAgentTool[agentTool.toolName] = agentTool;
    }
    Object.assign(toolKeyToAgentTool, mcpKeyToAgentTool);

    return {
        mcpClients,
        toolKeyToAgentTool,
        tools: {
            ...combinedTools,
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
        })
    }
    }
}

type ConstructAgentToolParams = {
  outputBuilder: ReturnType<typeof agentOutputBuilder>;
  structuredOutput?: AgentOutputField[];
  agentTools: AgentTool[];
  context: ActionContext
  model: LanguageModel
};

export type McpServerTools = {
    mcpName: string
    mcpClient: MCPClient
    tools: Record<string, Tool>
}