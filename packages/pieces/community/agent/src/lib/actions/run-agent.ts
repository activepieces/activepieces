import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { Agent, AgentTestResult, apId, ExecutionType, PauseType, RunAgentRequest, SeekPage, Todo } from '@activepieces/shared';

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
    agents: Property.Dropdown({
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
  },
  async run(context) {
    const serverToken = context.server.token;
    const userPrompt = context.propsValue.prompt;
    const agentId = context.propsValue.agents;

    if (context.executionType === ExecutionType.BEGIN) {
      const stateId = `__agent_todo_id_${apId()}`
      const actionLink = context.generateResumeUrl({
        queryParams: {
          stateId: stateId,
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
      await context.store.put(stateId, todo.id)
      return {
        todoId: todo.id,
      }
    } else {
      const todoId = await context.store.get<string>(context.resumePayload.queryParams['stateId'])
      const output: AgentTestResult = {
        todoId: todoId!,
        output: (context.resumePayload.body as { output: string })['output'],
      }
      return output
    }
  },
});
