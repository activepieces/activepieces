import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { Agent, AgentTestResult, AgentTaskStatus, apId, ExecutionType, PauseType, RunAgentRequest, SeekPage, Todo } from '@activepieces/shared';


enum EscalationMode {
  STOP = 'stop',
  IGNORE = 'ignore',
}

export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Run the AI assistant to complete your task.',
  auth: PieceAuth.None(),
  errorHandlingOptions: {
    retryOnFailure: {
      hide: true,
    },
    continueOnFailure: {
      hide: true,
    },
  },
  props: {
    agentId: Property.Dropdown({
      displayName: 'Agent',
      description: 'Select agent created',
      required: true,
      refreshers: [],
      options: async (_auth, ctx) => {
        const agent = await fetch(`${ctx.server.apiUrl}v1/agents`, {
          headers: {
            'Authorization': `Bearer ${ctx.server.token}`,
          },
        })
        const agents = await agent.json() as SeekPage<Agent>
        return {
          disabled: false,
          options: agents.data.map((agent) => {
            return {
              label: agent.displayName,
              value: agent.id,
            };
          }),
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe what you want the assistant to do.',
      required: true,
    }),
    escalation: Property.StaticDropdown<EscalationMode>({
      displayName: 'Escalation',
      description: 'The behavior when the agent fails to complete the task.',
      required: true,
      options: {
        options: [
          {
            label: 'Stop the flow',
            value: EscalationMode.STOP,
          },
          {
            label: 'Ignore and continue',
            value: EscalationMode.IGNORE,
          },
        ],
      },
      defaultValue: EscalationMode.STOP,
    }),
  },
  async run(context) {
    const serverToken = context.server.token;
    const userPrompt = context.propsValue.prompt;
    const agentId = context.propsValue.agentId;

    if (context.executionType === ExecutionType.BEGIN) {
      const actionLink = context.generateResumeUrl({
        queryParams: {
        },
      });
      context.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {
            status: 200,
            body: actionLink,
          },
        },
      });
      const request: RunAgentRequest = {
        prompt: userPrompt,
        callbackUrl: actionLink,
      }
      const response = await fetch(`${context.server.apiUrl}v1/agents/${agentId}/todos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serverToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      const todo = await response.json() as Todo
      return {
        todoId: todo.id,
      }
    } else {
      const result = context.resumePayload.body as AgentTestResult

      if (result.status == AgentTaskStatus.FAILED && context.propsValue.escalation == EscalationMode.STOP) {
        throw new Error(JSON.stringify(result))
      }
      return result
    }
  },
});
