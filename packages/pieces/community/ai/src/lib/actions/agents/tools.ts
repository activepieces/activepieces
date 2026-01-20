import { dynamicTool, LanguageModel, Tool } from "ai";
import z from "zod";
import { agentUtils } from "./utils";
import { agentOutputBuilder } from "./agent-output-builder";
import { AgentMcpTool, AgentOutputField, AgentTaskStatus, AgentTool, AgentToolType, buildAuthHeaders, createTransportConfig, isNil, McpServerTools, TASK_COMPLETION_TOOL_NAME } from "@activepieces/shared";
import { ActionContext } from "@activepieces/pieces-framework";
import { experimental_createMCPClient as createMCPClient, MCPClient, MCPTransport } from '@ai-sdk/mcp';

type FlattenedMcpResult = {
  mcpClients: MCPClient[];
  tools: Record<string, Tool>;
};

function flattenMcpServers(
    servers: McpServerTools[]
  ): FlattenedMcpResult {
    const mcpClients: MCPClient[] = [];
    const tools: Record<string, Tool> = {};

    for (const server of servers) {
      mcpClients.push(server.mcpClient);

      for (const [toolName, fn] of Object.entries(server.tools)) {
        tools[`${toolName}_${server.mcpName}`] = fn;
      }
    }

    return { mcpClients, tools };
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
): Promise<{ tools: Record<string, Tool>, mcpClients: MCPClient[] }> {

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
    const mcpServerTools = await constructMcpServersTools(agentTools.filter(tool => tool.type === AgentToolType.MCP))
    const { mcpClients, tools: mcpTools } = flattenMcpServers(mcpServerTools)

    const combinedTools = {
      ...agentPieceTools,
      ...flowsTools,
      ...mcpTools,
    };

    return {
        mcpClients,
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
                    .nullable()
                    .describe(
                      'The message to the user with the result of your task. This is optional and can be omitted if you have not achieved the goal.'
                    ),
                }),
          }),
          execute: async (params) => {
            const { success, output } = params as {
              success: boolean;
              output?: Record<string, unknown>;
            };
            outputBuilder.setStatus(
              success ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED
            );
            if (!isNil(structuredOutput) && !isNil(output)) {
              outputBuilder.setStructuredOutput(output);
            }
            if (!isNil(structuredOutput) && !isNil(output)) {
              outputBuilder.addMarkdown(output as unknown as string);
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