import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { AIUsageFeature, createAIModel } from '@activepieces/common-ai'
import { agentCommon } from '../common';
import {  AgentRun } from '@activepieces/shared';
import { openai } from '@ai-sdk/openai';
import { stepCountIs, streamText } from 'ai';

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
              value: agent.externalId,
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
    maxSteps: Property.Number({
      displayName: 'Max steps',
      description: 'The numbder of interations the agent can do',
      required: true,
      defaultValue: 20,
    })
  },
  async run(context) {
    const { agentId, prompt, maxSteps } = context.propsValue
    const { server } = context

    const agentRun = await agentCommon.createAgentRun({
      token: server.token,
      agentId,
      apiUrl: server.publicUrl,
      prompt 
    })

    const agentResult = agentCommon.createInitialAgentResult(agentRun.projectId)

    await agentCommon.updateAgentRun({
      agentRunId: agentRun.id,
      apiUrl: server.publicUrl,
      token: server.token,
      agentResult
    }) 

    const baseURL = `${server.apiUrl}v1/ai-providers/proxy/openai`
    const model = createAIModel({
      providerName: 'openai',
      modelInstance: openai('gpt-4.1'),
      engineToken: server.token,
      baseURL,
      metadata: {
        feature: AIUsageFeature.AGENTS,
        agentid: agentId,
      },
    })

    const systemPrompt = agentCommon.constructSystemPrompt(prompt)
    const { fullStream } = streamText({
      model,
      system: systemPrompt,
      prompt: prompt,
      stopWhen: stepCountIs(maxSteps),
    })

    let currentText = ''

    for await (const chunk of fullStream) {
      if (chunk.type === 'text-delta') {
        currentText += chunk.text
      }
      else if (chunk.type === 'error') {
        agentCommon.handleStreamError(chunk, agentResult)
        
        await agentCommon.updateAgentRun({
          agentRunId: agentRun.id,
          apiUrl: server.publicUrl,
          token: server.token,
          agentResult
        }) 
        return
      }

      if (agentResult.steps.length > 0) {
        await agentCommon.updateAgentRun({
          agentRunId: agentRun.id,
          apiUrl: server.publicUrl,
          token: server.token,
          agentResult
        })
      }
    }

    const finalizedResult = agentCommon.finalizeAgentResult(agentResult, currentText)
    
    const lastAgentRun = await agentCommon.updateAgentRun({
      agentRunId: agentRun.id,
      apiUrl: server.publicUrl,
      token: server.token,
      agentResult: finalizedResult
    })

    return mapAgentRunToOutput(lastAgentRun)
  },
});

function mapAgentRunToOutput(agentRun: AgentRun): Record<string, unknown> {
  return {
    steps: agentRun.steps,
    status: agentRun.status,
    output: agentRun.output,
    agentRunId: agentRun.id,
    message: agentRun.message
  }
}