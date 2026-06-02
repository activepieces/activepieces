import { AIProviderName } from '@activepieces/shared';
import { createAIModel, reportUsage } from '../../common/ai-sdk';
import { createAction, Property } from '@activepieces/pieces-framework';
import { generateText, ModelMessage } from 'ai';
import { aiProps } from '../../common/props';
import { buildWebSearchOptionsProperty, buildWebSearchConfig } from '../../common/web-search';

export const askAI = createAction({
  name: 'askAi',
  displayName: 'Ask AI',
  description: 'A flexible AI step. ask it to analyze data, explain, draft, or decide based on your flow\'s data.',
  props: {
    provider: aiProps({ modelType: 'text' }).provider,
    model: aiProps({ modelType: 'text' }).model,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      required: false,
    }),
    creativity: Property.Number({
      displayName: 'Creativity',
      required: false,
      defaultValue: 100,
      description:
        'Controls the creativity of the AI response. A higher value will make the AI more creative and a lower value will make it more deterministic.',
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
    webSearch: Property.Checkbox({
      displayName: 'Web Search',
      required: false,
      defaultValue: false,
      description:
        'Whether to use web search to find information for the AI to use in its response.',
    }),
    webSearchOptions: buildWebSearchOptionsProperty(
      (propsValue) => ({
        provider: propsValue['provider'] as string | undefined,
        model: propsValue['model'] as string | undefined,
      }),
      ['webSearch', 'provider', 'model'],
    ),
  },
  async run(context) {
    const { provider, model: modelId, prompt, systemPrompt, creativity, maxOutputTokens, webSearch, webSearchOptions } = context.propsValue;

    const model = await createAIModel({
      provider: provider as AIProviderName,
      modelId,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
      projectId: context.project.id,
      flowId: context.flows.current.id,
      runId: context.run.id,
    });

    const { webSearchTools, providerOptions: webSearchProviderOptions } = await buildWebSearchConfig({
      webSearch,
      webSearchOptions,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
    });

    const response = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: systemPrompt,
      maxOutputTokens,
      temperature: (creativity ?? 100) / 100,
      tools: webSearchTools,
      providerOptions: {
        ...webSearchProviderOptions,
        [provider]: {
          ...(provider === AIProviderName.OPENAI ? { reasoning_effort: 'minimal' } : {}),
        }
      }
    });

    if (provider === AIProviderName.ACTIVEPIECES) {
      await reportUsage({
        engineToken: context.server.token,
        apiUrl: context.server.apiUrl,
        usage: {
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
        },
      }).catch(err => {
        console.error('Failed to report AI usage', err)
      })
    }

    const includeSources = webSearch && webSearchOptions?.includeSources;
    if (includeSources && 'sources' in response) {
      return { text: response.text, sources: (response as any).sources };
    }

    return response.text ?? '';
  },
});
