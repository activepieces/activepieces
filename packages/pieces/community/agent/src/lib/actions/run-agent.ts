import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { agentCommon } from '../common';
import { agentExecutor } from '../agent-executor';


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
        const agentPage = await agentCommon.listAgents({
          publicUrl: ctx.server.publicUrl,
          token: ctx.server.token,
        })
        return {
          disabled: false,
          options: agentPage.body.data.map((agent) => {
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
    const { agentId, prompt } = context.propsValue
    const serverToken = context.server.token;



    return agentExecutor.execute({
      agentId,
      prompt,
      update: async (data: Record<string, unknown>) => {
        await context.output.update({
          data,
        })
      },
      serverToken,
      publicUrl: context.server.publicUrl,
      flowId: context.flows.current.id,
      runId: context.run.id,
    })
  },
});
