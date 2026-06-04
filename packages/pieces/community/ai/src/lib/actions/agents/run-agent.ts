import {
  createAction,
  Property,
  PieceAuth,
  ArraySubProps,
} from '@activepieces/pieces-framework';
import {
  AgentOutputField,
  AgentPieceProps,
  AgentTaskStatus,
  isNil,
  AgentTool,
  TASK_COMPLETION_TOOL_NAME,
  AIProviderName,
  AgentProviderModel,
  ExecutionToolStatus,
  AgentToolType,
  AgentKnowledgeBaseTool,
  KnowledgeBaseSourceType,
  normalizeToolOutputToExecuteResponse,
  spreadIfDefined,
  getEffectiveProviderAndModel,
} from '@activepieces/shared';
import { hasToolCall, stepCountIs, streamText } from 'ai';
import { agentOutputBuilder } from './agent-output-builder';
import { createAIModel, createEmbeddingModel } from '../../common/ai-sdk';
import { inspect } from 'util';
import { agentUtils } from './utils';
import { constructAgentTools } from './tools';
import { buildWebSearchOptionsProperty, buildWebSearchConfig, WebSearchOptions } from '../../common/web-search';

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
  async run(context) {
    const { prompt, maxSteps, aiProviderModel } = context.propsValue;
    const agentProviderModel = aiProviderModel as AgentProviderModel
    const provider = agentProviderModel.provider as AIProviderName;
    const webSearchEnabled = !!(context.propsValue.webSearch);
    const webSearchOptions = (context.propsValue.webSearchOptions ?? {}) as WebSearchOptions;

    const { tools: webSearchTools, providerOptions } = buildWebSearchConfig({
      provider,
      model: agentProviderModel.model,
      webSearchEnabled,
      webSearchOptions,
    });

    const { provider: effectiveProvider } = getEffectiveProviderAndModel({
      provider,
      model: agentProviderModel.model,
    });
    const model = await createAIModel({
      modelId: agentProviderModel.model,
      provider,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
      projectId: context.project.id,
      flowId: context.flows.current.id,
      runId: context.run.id,
      ...spreadIfDefined('openaiResponsesModel', webSearchEnabled && effectiveProvider === AIProviderName.OPENAI ? true : undefined),
    });
    const outputBuilder = agentOutputBuilder(prompt);
    const hasStructuredOutput =
      !isNil(context.propsValue.structuredOutput) &&
      context.propsValue.structuredOutput.length > 0;
    const structuredOutput = hasStructuredOutput ? context.propsValue.structuredOutput as AgentOutputField[] : undefined;
    const agentTools = context.propsValue.agentTools as AgentTool[];

    const hasKnowledgeBaseTools = agentTools.some(t => t.type === AgentToolType.KNOWLEDGE_BASE);
    const kbFileTools = agentTools.filter(
      (t): t is AgentKnowledgeBaseTool => t.type === AgentToolType.KNOWLEDGE_BASE && t.sourceType === KnowledgeBaseSourceType.FILE,
    );
    const hasKbFileTools = kbFileTools.length > 0;
    let embeddingConfig;
    if (hasKbFileTools) {
      try {
        const result = await createEmbeddingModel({
          provider: agentProviderModel.provider as AIProviderName,
          engineToken: context.server.token,
          apiUrl: context.server.apiUrl,
        });
        embeddingConfig = { model: result.model, providerOptions: result.providerOptions };
      }
      catch (err) {
        outputBuilder.addMarkdown(`\n\n**Warning:** Could not create embedding model for knowledge base search: ${err instanceof Error ? err.message : 'Unknown error'}\n\n`);
      }
    }

    const { mcpClients, tools, toolKeyToAgentTool } = await constructAgentTools({
      context,
      agentTools,
      model,
      outputBuilder,
      structuredOutput,
      embeddingConfig,
    });
    outputBuilder.setToolMap(toolKeyToAgentTool);

    const allTools = webSearchTools
      ? { ...webSearchTools, ...tools }
      : tools;

    const errors: { type: string; message: string; details?: unknown }[] = [];

    try {
      const prompts = agentUtils.getPrompts(prompt, { hasKnowledgeBaseTools });
      const stream = streamText({
        model: model,
        system: prompts.system,
        prompt: prompts.prompt,
        tools: allTools,
        stopWhen: [stepCountIs(maxSteps), hasToolCall(TASK_COMPLETION_TOOL_NAME)],
        providerOptions,
        onFinish: async () => {
          await Promise.all(mcpClients.map(async (client) => client.close()));
        },
      });

      for await (const chunk of stream.fullStream) {
        try {
          switch (chunk.type) {
            case 'text-delta': {
              outputBuilder.addMarkdown(chunk.text);
              break;
            }
            case 'reasoning-delta': {
              if ('text' in chunk && typeof chunk.text === 'string') {
                outputBuilder.addMarkdown(chunk.text);
              } else if ('delta' in chunk && typeof chunk.delta === 'string') {
                outputBuilder.addMarkdown(chunk.delta);
              }
              break;
            }
            case 'tool-call': {
              if (agentUtils.isTaskCompletionToolCall(chunk.toolName)) {
                continue;
              }
              outputBuilder.startToolCall({
                toolName: chunk.toolName,
                toolCallId: chunk.toolCallId,
                input: chunk.input as Record<string, unknown>,
              });
              break;
            }
            case 'tool-result': {
              if (agentUtils.isTaskCompletionToolCall(chunk.toolName)) {
                continue;
              }
              const rawOutput = chunk.output;
              const toolOutput = normalizeToolOutputToExecuteResponse(rawOutput);
              
              if (toolOutput['status'] === ExecutionToolStatus.FAILED && toolOutput['errorMessage']) {
                outputBuilder.addMarkdown(
                  `\n\n**Error:** ${JSON.stringify(toolOutput['errorMessage'])}\n\n`
                );
              }
              
              outputBuilder.finishToolCall({
                toolCallId: chunk.toolCallId,
                output: toolOutput,
              });
              break;
            }
            case 'tool-error': {
              errors.push({
                type: 'tool-error',
                message: `Tool ${chunk.toolName} failed`,
                details: chunk.error,
              });
              outputBuilder.failToolCall({
                toolCallId: chunk.toolCallId,
              });
              break;
            }
            case 'error': {
              errors.push({
                type: 'stream-error',
                message: 'Error during streaming',
                details: inspect(chunk.error),
              });
              break;
            }
            case 'start':
            case 'start-step':
            case 'tool-input-start':
            case 'tool-input-delta':
            case 'tool-input-end':
            case 'finish-step':
            case 'finish':
              break;
            default:
              break;
          }
          await context.output.update({ data: outputBuilder.build() });
        } catch (innerError) {
          let detailsStr: string;
          try {
            detailsStr = typeof innerError === 'object' && innerError !== null && 'message' in innerError
              ? `${(innerError as Error).message}${(innerError as Error).stack ? `\n${(innerError as Error).stack}` : ''}`
              : inspect(innerError);
          } catch {
            detailsStr = String(innerError);
          }
          errors.push({
            type: 'chunk-processing-error',
            message: `Error processing chunk (type=${chunk.type})`,
            details: detailsStr,
          });
        }
      }

      if (!outputBuilder.hasTextContent()) {
        try {
          const accumulatedText = await stream.text;
          if (accumulatedText?.trim()) {
            outputBuilder.addMarkdown(accumulatedText);
            await context.output.update({ data: outputBuilder.build() });
          }
        } catch {
          // ignore
        }
      }

      if (errors.length > 0) {
        const errorSummary = errors.map(e => {
          const detail = e.details != null ? `\n  ${String(e.details)}` : '';
          return `${e.type}: ${e.message}${detail}`;
        }).join('\n');
        outputBuilder.addMarkdown(`\n\n**Errors encountered:**\n${errorSummary}`);
        outputBuilder.fail({ message: 'Agent completed with errors' });
        await context.output.update({ data: outputBuilder.build() });
      } else {
        outputBuilder.setStatus(AgentTaskStatus.COMPLETED)
      }

    } catch (error) {
      let errorMessage = `Agent failed unexpectedly: ${inspect(error)}`;
      if (errors.length > 0) {
        const collectedErrors = errors.map(e => {
          const detail = e.details != null ? `\n  ${String(e.details)}` : '';
          return `${e.type}: ${e.message}${detail}`;
        }).join('\n');
        errorMessage += `\n\nCollected stream errors:\n${collectedErrors}`;
      }
      outputBuilder.fail({ message: errorMessage });
      await context.output.update({ data: outputBuilder.build() });
      await Promise.all(mcpClients.map(async (client) => client.close()));
    }

    return outputBuilder.build();
  }
});