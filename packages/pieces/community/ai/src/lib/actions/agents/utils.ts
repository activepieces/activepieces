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
} from '@activepieces/shared';
import { z, ZodObject } from 'zod';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

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
  getPrompts(userPrompt: string) {
    return {
       prompt: `
        ${userPrompt}

        <important_note>
        As your FINAL ACTION, you must call the \`${TASK_COMPLETION_TOOL_NAME}\` tool to indicate if the task is complete or not.
        Call this tool only once you have done everything you can to achieve the user's goal, or if you are unable to continue.
        If you do not make this final call, your work will be considered unsuccessful.
        </important_note>
      `,
      system: `
        You are a helpful, proactive AI assistant.
        Today's date is ${new Date().toISOString().split('T')[0]}.

        Help the user finish their goal quickly and accurately.
      `.trim(),
    }
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