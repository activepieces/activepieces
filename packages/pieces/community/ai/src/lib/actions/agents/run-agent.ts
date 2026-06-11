import {
  createAction,
  Property,
  PieceAuth,
  ArraySubProps,
  AgentToolExecutor,
} from '@activepieces/pieces-framework';
import {
  AgentFlowTool,
  AgentKnowledgeBaseTool,
  AgentMcpTool,
  AgentOutputField,
  AgentPieceProps,
  AgentPieceTool,
  AgentProviderModel,
  AgentResult,
  AgentTaskStatus,
  AgentTool,
  AgentToolCall,
  AgentToolType,
  AgentYieldStatus,
  apId,
  ContentBlockType,
  ExecuteToolResponse,
  ExecutionToolStatus,
  isNil,
  RunAgentRequest,
  spreadIfDefined,
} from '@activepieces/shared';
import { buildWebSearchOptionsProperty } from '../../common/web-search';

const agentToolArrayItems: ArraySubProps<boolean> = {
  type: Property.ShortText({
    displayName: 'Tool Type',
    required: true,
  }),

  toolName: Property.ShortText({
    displayName: 'Tool Name',
    required: true,
  }),

  pieceMetadata: Property.Json({
    displayName: 'Piece Metadata',
    required: false,
  }),

  externalFlowId: Property.ShortText({
    displayName: 'Flow External ID',
    required: false,
  }),

  serverUrl: Property.ShortText({
    displayName: 'MCP Server URL',
    required: false,
  }),
  protocol: Property.ShortText({
    displayName: 'Protocol',
    required: false,
  }),
  auth: Property.Json({
    displayName: 'Auth Configuration',
    required: false,
  }),

  sourceType: Property.ShortText({
    displayName: 'Source Type',
    required: false,
  }),
  sourceId: Property.ShortText({
    displayName: 'Source ID',
    required: false,
  }),
  sourceName: Property.ShortText({
    displayName: 'Source Name',
    required: false,
  }),
}

export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Handles complex, multi-step tasks by reasoning through problems, using tools accurately, and iterating until the job is done.',
  auth: PieceAuth.None(),
  props: {
    [AgentPieceProps.PROMPT]: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe what you want the assistant to do.',
      required: true,
    }),
    [AgentPieceProps.AI_PROVIDER_MODEL]: Property.Object({
      displayName: 'AI Model',
      required: true,
    }),
    [AgentPieceProps.AGENT_TOOLS]: Property.Array({
      displayName: 'Agent Tools',
      required: false,
      properties: agentToolArrayItems,
    }),
    [AgentPieceProps.STRUCTURED_OUTPUT]: Property.Array({
      displayName: 'Structured Output',
      defaultValue: undefined,
      required: false,
      properties: {
        displayName: Property.ShortText({
          displayName: 'Display Name',
          required: true,
        }),
        description: Property.ShortText({
          displayName: 'Description',
          required: false,
        }),
        type: Property.ShortText({
          displayName: 'Type',
          required: true,
        }),
      },
    }),
    [AgentPieceProps.MAX_STEPS]: Property.Number({
      displayName: 'Max steps',
      description: 'The number of iterations the agent can do',
      required: true,
      defaultValue: 20,
    }),
    [AgentPieceProps.WEB_SEARCH]: Property.Checkbox({
      displayName: 'Web Search',
      required: false,
      defaultValue: false,
      description:
        'Whether to use web search to find information for the AI to use.',
    }),
    [AgentPieceProps.WEB_SEARCH_OPTIONS]: buildWebSearchOptionsProperty(
      (propsValue) => {
        const aiProviderModel = propsValue['aiProviderModel'] as AgentProviderModel | undefined;
        return { provider: aiProviderModel?.provider, model: aiProviderModel?.model };
      },
      ['webSearch', 'aiProviderModel'],
      { showIncludeSources: false },
    ),
  },
  /**
   * Thin shell over the worker-side agent loop. The model runs on the WORKER (`context.agent.run`),
   * which executes worker-native tools (MCP / knowledge base / flow / web search) itself and yields
   * `NEED_TOOLS` whenever the model calls a piece tool — those run HERE, in the flow's own sandbox,
   * via the engine-built executors. Provider credentials never enter the sandbox; live progress is
   * streamed by the worker; the final `AgentResult` rides back on the `DONE` yield.
   */
  async run(context) {
    const { prompt, maxSteps } = context.propsValue;
    const { provider, model } = context.propsValue.aiProviderModel as AgentProviderModel;
    const agentTools = (context.propsValue.agentTools ?? []) as AgentTool[];
    const structuredOutputFields = context.propsValue.structuredOutput as AgentOutputField[] | undefined;
    const structuredOutput = !isNil(structuredOutputFields) && structuredOutputFields.length > 0
      ? structuredOutputFields
      : undefined;

    const pieceTools = agentTools.filter((tool): tool is AgentPieceTool => tool.type === AgentToolType.PIECE);
    const { executors, descriptors } = await context.agent.tools({ tools: pieceTools, provider, model });

    const request: RunAgentRequest = {
      agentRunId: apId(),
      prompt,
      maxSteps,
      provider,
      model,
      ...spreadIfDefined('structuredOutput', structuredOutput),
      mcpTools: agentTools.filter((tool): tool is AgentMcpTool => tool.type === AgentToolType.MCP),
      knowledgeBaseTools: agentTools.filter((tool): tool is AgentKnowledgeBaseTool => tool.type === AgentToolType.KNOWLEDGE_BASE),
      flowTools: agentTools.filter((tool): tool is AgentFlowTool => tool.type === AgentToolType.FLOW),
      pieceTools: descriptors,
      webSearchEnabled: context.propsValue.webSearch === true,
      ...spreadIfDefined('webSearchOptions', context.propsValue.webSearchOptions),
    };

    let result = await context.agent.run(request);
    while (result.status === AgentYieldStatus.NEED_TOOLS) {
      const toolResults = await Promise.all(result.toolCalls.map(async (toolCall) => ({
        toolCallId: toolCall.toolCallId,
        output: await runPieceTool({ executors, toolCall }),
      })));
      result = await context.agent.continueRun({ agentRunId: request.agentRunId, toolResults });
    }

    if (result.status === AgentYieldStatus.DONE) {
      return result.output;
    }
    return result.partialOutput ?? buildFailedResult({ prompt, errorMessage: result.errorMessage });
  }
});

async function runPieceTool({ executors, toolCall }: RunPieceToolParams): Promise<ExecuteToolResponse> {
  const executor = executors[toolCall.toolName];
  if (isNil(executor)) {
    return {
      status: ExecutionToolStatus.FAILED,
      output: undefined,
      resolvedInput: {},
      errorMessage: `Unknown piece tool: ${toolCall.toolName}`,
    };
  }
  const instruction = typeof toolCall.input['instruction'] === 'string'
    ? toolCall.input['instruction']
    : JSON.stringify(toolCall.input);
  return executor({ instruction });
}

function buildFailedResult({ prompt, errorMessage }: BuildFailedResultParams): AgentResult {
  return {
    prompt,
    status: AgentTaskStatus.FAILED,
    steps: [{ type: ContentBlockType.MARKDOWN, markdown: errorMessage }],
  };
}

type RunPieceToolParams = {
  executors: Record<string, AgentToolExecutor>;
  toolCall: AgentToolCall;
};

type BuildFailedResultParams = {
  prompt: string;
  errorMessage: string;
};
