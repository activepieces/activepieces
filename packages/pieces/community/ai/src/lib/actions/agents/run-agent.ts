import {
  createAction,
  Property,
  PieceAuth,
  ArraySubProps,
  ExecutionType,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { AgentPieceProps, AgentProviderModel, AgentResult, spreadIfDefined } from '@activepieces/pieces-framework';

// Backstop for a worker that dies with nothing to report. It has to outlive the server's own turn
// budget, or it fires mid-run and throws away an answer that was still coming.
const AGENT_STEP_TIMEOUT_MS = 3 * 60 * 60 * 1_000;

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
  audience: 'both',
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Handles complex, multi-step tasks by reasoning through problems, using tools accurately, and iterating until the job is done.',
  aiMetadata: { description: 'Runs an agent that reasons over your prompt and calls the piece actions you attach to this step, iterating until the task is done. Pick it when the work needs tool use or an unknown number of steps; prefer askAi for a single prompt-in/answer-out call, or classifyText and extractStructuredData for one narrow analysis. Sub-flow, MCP and knowledge-base tools are not supported on this step. Requires a prompt and an AI Model; not idempotent, as the agent performs side effects through its tools.', idempotent: false },
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
    [AgentPieceProps.MAX_STEPS]: Property.Number({
      displayName: 'Max steps',
      description: 'The number of iterations the agent can do',
      required: true,
      defaultValue: 20,
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
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      const result = context.resumePayload?.body as AgentResult | undefined;
      if (isNil(result)) {
        throw new Error('The agent did not report a result before this step timed out');
      }
      return result;
    }

    const agentTools = context.propsValue.agentTools ?? [];
    const tools = toolsWithoutResolvedAuth(agentTools);

    const waitpoint = await context.run.createWaitpoint({
      type: 'WEBHOOK',
      resumeDateTime: new Date(Date.now() + AGENT_STEP_TIMEOUT_MS).toUTCString(),
    });

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/agents/runs`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.server.token },
      body: {
        instruction: context.propsValue.prompt,
        flowRunId: context.run.id,
        waitpointId: waitpoint.id,
        ...spreadIfDefined('modelName', (context.propsValue.aiProviderModel as AgentProviderModel | undefined)?.model),
        ...spreadIfDefined('provider', (context.propsValue.aiProviderModel as AgentProviderModel | undefined)?.provider),
        tools,
        structuredOutput: context.propsValue.structuredOutput ?? [],
        ...spreadIfDefined('maxSteps', context.propsValue.maxSteps),
      },
    });

    context.run.waitForWaitpoint(waitpoint.id);
    return {};
  },
});

// The engine resolves {{connections[...]}} in every step input, so a connection pinned on a tool
// arrives here as the decrypted credential rather than its id. The server wants the id and rebuilds
// the reference itself, so anything that is not an id is dropped rather than sent.
function toolsWithoutResolvedAuth(tools: unknown[]): unknown[] {
  return tools.map((tool) => {
    const piece = (tool as { pieceMetadata?: { predefinedInput?: { auth?: unknown } } }).pieceMetadata;
    const auth = piece?.predefinedInput?.auth;
    if (isNil(auth) || typeof auth === 'string') {
      return tool;
    }
    throw new Error(
      'This agent step pins a connection in a form the server cannot accept yet. Remove the pinned connection from the tool, or wait for the update that stores it by reference.',
    );
  });
}
