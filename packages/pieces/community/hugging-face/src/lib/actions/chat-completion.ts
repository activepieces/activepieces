import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from '@huggingface/inference';
import type { ChatCompletionInput } from '@huggingface/tasks';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../../index';

export const chatCompletion = createAction({
  name: 'chat_completion',
  auth: huggingFaceAuth,
  displayName: 'Chat Completion',
  description:
    'Generate assistant replies using chat-style LLMs - perfect for FAQ bots, support agents, and content generation',
  props: {
    useCase: Property.StaticDropdown({
      displayName: 'Use Case',
      description: 'What type of chat assistant are you building?',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'FAQ & Customer Support',
            value: 'faq',
          },
          {
            label: 'Content Generation & Writing',
            value: 'content',
          },
          {
            label: 'General Conversation',
            value: 'chat',
          },
          {
            label: 'Search All Models',
            value: 'search',
          },
        ],
      },
      defaultValue: 'faq',
    }),
    model: Property.Dropdown({
      displayName: 'Chat Model',
      description: 'Select the best model for your use case',
      required: true,
      refreshers: ['useCase'],
      options: async ({ auth, useCase }) => {
        // Define model options based on use case
        const getModelsByUseCase = (type: string) => {
          switch (type) {
            case 'faq':
              return [
                {
                  label:
                    'Llama-3.2-1B (3.3M downloads) - Fast FAQ responses',
                  value: 'meta-llama/Llama-3.2-1B-Instruct',
                },
                {
                  label: 'Qwen2.5-1.5B (3M downloads) - Efficient support',
                  value: 'Qwen/Qwen2.5-1.5B-Instruct',
                },
                {
                  label: 'Gemma-3-1B (2.6M downloads) - Google optimized',
                  value: 'google/gemma-3-1b-it',
                },
                {
                  label: 'FAQ ChatBot (E-commerce specialist)',
                  value: 'Alkyema/FAQ_ChatBot',
                },
              ];
            case 'content':
              return [
                {
                  label: 'Llama-3.1-8B (14.2M downloads) - High quality',
                  value: 'meta-llama/Llama-3.1-8B-Instruct',
                },
                {
                  label: 'Qwen2.5-7B (9.1M downloads) - Great balance',
                  value: 'Qwen/Qwen2.5-7B-Instruct',
                },
                {
                  label: 'Qwen2.5-14B (12.2M downloads) - Best quality',
                  value: 'Qwen/Qwen2.5-14B-Instruct',
                },
                {
                  label: 'OpenAI GPT-OSS-20B (3.7M downloads) - Creative',
                  value: 'openai/gpt-oss-20b',
                },
              ];
            case 'chat':
              return [
                {
                  label: 'Qwen2.5-7B (9.1M downloads) - Best overall',
                  value: 'Qwen/Qwen2.5-7B-Instruct',
                },
                {
                  label: 'Llama-3.2-1B (3.3M downloads) - Fast responses',
                  value: 'meta-llama/Llama-3.2-1B-Instruct',
                },
                {
                  label: 'Qwen2.5-1.5B (3M downloads) - Efficient',
                  value: 'Qwen/Qwen2.5-1.5B-Instruct',
                },
                {
                  label: 'Gemma-3-1B (2.6M downloads) - Reliable',
                  value: 'google/gemma-3-1b-it',
                },
              ];
            default:
              return [
                {
                  label: 'Qwen2.5-7B (9.1M downloads)',
                  value: 'Qwen/Qwen2.5-7B-Instruct',
                },
              ];
          }
        };

        // Return use case-specific models for non-search types
        if (useCase !== 'search') {
          return {
            disabled: false,
            options: getModelsByUseCase((useCase as string) || 'faq'),
          };
        }

        // Handle search mode - load all conversational models
        const popularModels = [
          {
            label: 'Meta Llama-3.1-8B (14.2M downloads)',
            value: 'meta-llama/Llama-3.1-8B-Instruct',
          },
          {
            label: 'Qwen2.5-7B (9.1M downloads)',
            value: 'Qwen/Qwen2.5-7B-Instruct',
          },
          {
            label: 'Llama-3.2-1B (3.3M downloads)',
            value: 'meta-llama/Llama-3.2-1B-Instruct',
          },
        ];

        if (!auth) {
          return {
            disabled: false,
            options: popularModels,
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://huggingface.co/api/models',
            queryParams: {
              filter: 'conversational',
              sort: 'downloads',
              direction: '-1',
              limit: '100',
            },
          });

          const models = response.body as Array<{
            id: string;
            downloads: number;
            pipeline_tag: string;
          }>;

          const conversationalModels = models
            .filter(
              (model) =>
                model.pipeline_tag === 'conversational' ||
                model.pipeline_tag === 'text-generation'
            )
            .map((model) => ({
              label: `${model.id} (${
                model.downloads?.toLocaleString() || 0
              } downloads)`,
              value: model.id,
            }))
            .slice(0, 50);

          const allOptions = [
            ...popularModels,
            ...conversationalModels.filter(
              (model) =>
                !popularModels.some((popular) => popular.value === model.value)
            ),
          ];

          return {
            disabled: false,
            options: allOptions,
          };
        } catch (error) {
          return {
            disabled: false,
            options: popularModels,
          };
        }
      },
      defaultValue: 'meta-llama/Llama-3.2-1B-Instruct',
    }),
    conversationMode: Property.StaticDropdown({
      displayName: 'Conversation Mode',
      description: 'How do you want to build the conversation?',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Single Message (Simple Q&A)',
            value: 'single',
          },
          {
            label: 'Multi-turn Conversation',
            value: 'multi',
          },
          {
            label: 'Template-based Response',
            value: 'template',
          },
        ],
      },
      defaultValue: 'single',
    }),
    userMessage: Property.LongText({
      displayName: 'User Message',
      description: 'The user message or question to respond to',
      required: false,
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt (Optional)',
      description: 'Instructions for how the assistant should behave',
      required: false,
    }),
    conversationHistory: Property.Array({
      displayName: 'Conversation History',
      description:
        'Previous messages in the conversation (for multi-turn chat)',
      required: false,
    }),
    template: Property.StaticDropdown({
      displayName: 'Response Template',
      description: 'Pre-built templates for common business scenarios',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Customer Support Agent',
            value: 'support',
          },
          {
            label: 'FAQ Assistant',
            value: 'faq',
          },
          {
            label: 'Content Writer',
            value: 'writer',
          },
          {
            label: 'Email Responder',
            value: 'email',
          },
          {
            label: 'E-commerce Assistant',
            value: 'ecommerce',
          },
        ],
      },
    }),
    responseLength: Property.StaticDropdown({
      displayName: 'Response Length',
      description: 'How long should the response be?',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Brief (50-100 tokens)', value: 'brief' },
          { label: 'Normal (100-200 tokens)', value: 'normal' },
          { label: 'Detailed (200-400 tokens)', value: 'detailed' },
          { label: 'Custom', value: 'custom' },
        ],
      },
      defaultValue: 'normal',
    }),
    customMaxTokens: Property.Number({
      displayName: 'Custom Max Tokens',
      description: 'Maximum number of tokens to generate',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Creativity Level',
      description:
        'How creative should responses be? (0.1 = focused, 1.0 = creative)',
      required: false,
      defaultValue: 0.7,
    }),
    topP: Property.Number({
      displayName: 'Response Variety',
      description: 'Controls response diversity (0.1 = focused, 1.0 = varied)',
      required: false,
      defaultValue: 0.9,
    }),
    stopSequences: Property.Array({
      displayName: 'Stop Sequences (Optional)',
      description: 'Text sequences that will stop generation',
      required: false,
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Repetition Penalty',
      description: 'Reduce repetitive responses (-2.0 to 2.0)',
      required: false,
      defaultValue: 0.0,
    }),
    presencePenalty: Property.Number({
      displayName: 'Topic Diversity',
      description: 'Encourage diverse topics (-2.0 to 2.0)',
      required: false,
      defaultValue: 0.0,
    }),
    useCache: Property.Checkbox({
      displayName: 'Use Cache',
      description: 'Use cached responses for identical requests',
      required: false,
      defaultValue: true,
    }),
    waitForModel: Property.Checkbox({
      displayName: 'Wait for Model',
      description: 'Wait for model to load if not immediately available',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      useCase,
      model,
      conversationMode,
      userMessage,
      systemPrompt,
      conversationHistory,
      template,
      responseLength,
      customMaxTokens,
      temperature,
      topP,
      stopSequences,
      frequencyPenalty,
      presencePenalty,
    } = context.propsValue;

    const messages: Array<{ role: string; content: string }> = [];

    const systemMessage = getSystemPrompt(
      template,
      systemPrompt,
      useCase as string
    );
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }

    switch (conversationMode) {
      case 'single':
        if (!userMessage?.trim()) {
          throw new Error(
            'Please provide a user message for single message mode'
          );
        }
        messages.push({ role: 'user', content: userMessage.trim() });
        break;

      case 'multi':
        // Add conversation history
        if (conversationHistory && Array.isArray(conversationHistory)) {
          const historyMessages = conversationHistory
            .filter(
              (msg: unknown): msg is { role: string; content: string } => {
                if (!msg || typeof msg !== 'object' || msg === null) {
                  return false;
                }
                const msgObj = msg as Record<string, unknown>;
                return (
                  'role' in msgObj &&
                  'content' in msgObj &&
                  typeof msgObj['role'] === 'string' &&
                  typeof msgObj['content'] === 'string'
                );
              }
            )
            .map((msg) => ({
              role: msg['role'] as string,
              content: msg['content'] as string,
            }));
          messages.push(...historyMessages);
        }

        if (userMessage?.trim()) {
          messages.push({ role: 'user', content: userMessage.trim() });
        }
        break;

      case 'template':
        if (!userMessage?.trim()) {
          throw new Error('Please provide a user message for template mode');
        }
        messages.push({ role: 'user', content: userMessage.trim() });
        break;

      default:
        if (!userMessage?.trim()) {
          throw new Error('Please provide a user message');
        }
        messages.push({ role: 'user', content: userMessage.trim() });
    }

    if (messages.length === 0) {
      throw new Error('No messages provided for the conversation');
    }

    let maxTokens: number;
    switch (responseLength) {
      case 'brief':
        maxTokens = 100;
        break;
      case 'normal':
        maxTokens = 200;
        break;
      case 'detailed':
        maxTokens = 400;
        break;
      case 'custom':
        maxTokens = customMaxTokens || 200;
        break;
      default:
        maxTokens = 200;
    }

    const hf = new InferenceClient(context.auth as string);

    const args: ChatCompletionInput = {
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature || 0.7,
      top_p: topP || 0.9,
      stream: false,
    };

    if (
      stopSequences &&
      Array.isArray(stopSequences) &&
      stopSequences.length > 0
    ) {
      const validStopSequences = stopSequences.filter(
        (seq): seq is string => typeof seq === 'string' && seq.trim().length > 0
      );
      if (validStopSequences.length > 0) {
        args.stop = validStopSequences;
      }
    }

    if (frequencyPenalty !== undefined && frequencyPenalty !== 0) {
      args.frequency_penalty = frequencyPenalty;
    }

    if (presencePenalty !== undefined && presencePenalty !== 0) {
      args.presence_penalty = presencePenalty;
    }

    const chatResult = await hf.chatCompletion(args);

    const assistantMessage = chatResult.choices?.[0]?.message?.content || '';
    const finishReason = chatResult.choices?.[0]?.finish_reason || 'unknown';

    const userMessageLength = userMessage?.length || 0;
    const assistantMessageLength = assistantMessage.length;
    const tokenUsage = chatResult.usage;

    return {
      response: assistantMessage,
      conversation: {
        userMessage: userMessage || '',
        assistantMessage: assistantMessage,
        fullConversation: [
          ...messages,
          { role: 'assistant', content: assistantMessage },
        ],
      },
      metadata: {
        model: model,
        useCase: useCase,
        conversationMode: conversationMode,
        template: template || 'none',
        finishReason: finishReason,
      },
      metrics: {
        userMessageLength: userMessageLength,
        responseLength: assistantMessageLength,
        tokensUsed: tokenUsage?.total_tokens || 0,
        promptTokens: tokenUsage?.prompt_tokens || 0,
        completionTokens: tokenUsage?.completion_tokens || 0,
        estimatedCost: calculateEstimatedCost(
          model,
          tokenUsage?.total_tokens || 0
        ),
      },
      businessInsights: {
        useCase: getUseCaseDescription(useCase as string),
        qualityTips: getQualityTips(assistantMessage, finishReason),
        nextSteps: getNextSteps(conversationMode, finishReason),
      },
      rawResult: chatResult,
    };
  },
});

function getSystemPrompt(
  template: string | undefined,
  customPrompt: string | undefined,
  useCase: string
): string {
  if (customPrompt?.trim()) {
    return customPrompt.trim();
  }

  const templates = {
    support:
      "You are a helpful customer support agent. Be empathetic, professional, and solution-focused. Always acknowledge the customer's concern and provide clear, actionable steps to resolve their issue.",
    faq: "You are an FAQ assistant. Provide concise, accurate answers to common questions. If you don't know the answer, politely suggest contacting support or checking documentation.",
    writer:
      'You are a professional content writer. Create engaging, well-structured content that is clear, informative, and appropriate for the target audience. Use proper grammar and formatting.',
    email:
      "You are an email response assistant. Write professional, courteous emails that address the recipient's needs clearly and concisely. Include appropriate greetings and closings.",
    ecommerce:
      'You are an e-commerce assistant. Help customers with product information, orders, shipping, and returns. Be knowledgeable about products and policies while maintaining a friendly, sales-oriented approach.',
  };

  if (template && template in templates) {
    return templates[template as keyof typeof templates];
  }

  const defaultPrompts = {
    faq: 'You are a helpful FAQ assistant. Provide clear, concise answers to user questions.',
    content:
      'You are a professional content creator. Generate high-quality, engaging content based on user requests.',
    chat: 'You are a helpful and friendly AI assistant. Provide helpful responses while being conversational and engaging.',
  };

  return (
    defaultPrompts[useCase as keyof typeof defaultPrompts] ||
    'You are a helpful AI assistant.'
  );
}

function getUseCaseDescription(useCase: string): string {
  const descriptions = {
    faq: 'Perfect for answering frequently asked questions and providing customer support',
    content:
      'Ideal for content creation, writing assistance, and creative projects',
    chat: 'Great for general conversation and interactive assistance',
    search: 'Custom model selection for specialized chat requirements',
  };

  return (
    descriptions[useCase as keyof typeof descriptions] ||
    'General purpose chat assistance'
  );
}

function getQualityTips(response: string, finishReason: string): string[] {
  const tips: string[] = [];

  if (response.length < 20) {
    tips.push(
      '⚠️ Response is very short - consider using Normal or Detailed length'
    );
  }

  if (response.length > 1000) {
    tips.push(
      '📝 Very long response - consider using Brief or Normal length for better user experience'
    );
  }

  if (finishReason === 'length') {
    tips.push(
      '✂️ Response was truncated - increase max tokens for complete responses'
    );
  }

  if (finishReason === 'stop') {
    tips.push(
      '🛑 Response stopped at stop sequence - this is expected behavior'
    );
  }

  if (response.includes("I don't know") || response.includes('I cannot')) {
    tips.push(
      '🎯 Consider providing more context or using a template with better instructions'
    );
  }

  if (tips.length === 0) {
    tips.push('✅ Good response quality achieved');
  }

  return tips;
}

function getNextSteps(
  conversationMode: string,
  finishReason: string
): string[] {
  const steps: string[] = [];

  if (conversationMode === 'single') {
    steps.push('💡 Switch to Multi-turn mode for follow-up conversations');
  }

  if (conversationMode === 'multi') {
    steps.push('🔄 Add this response to conversation history for context');
  }

  if (finishReason === 'length') {
    steps.push('⚙️ Increase max tokens or use Detailed response length');
  }

  steps.push('📊 Monitor token usage for cost optimization');
  steps.push('🎯 Fine-tune temperature and penalties for better responses');

  return steps;
}

function calculateEstimatedCost(model: string, totalTokens: number): string {
  const costPer1M = model.includes('llama-3.1-8b')
    ? 0.6
    : model.includes('qwen')
    ? 0.3
    : model.includes('gemma')
    ? 0.25
    : 0.5;

  const estimatedCost = (totalTokens / 1000000) * costPer1M;

  if (estimatedCost < 0.001) {
    return '< $0.001';
  }

  return `~$${estimatedCost.toFixed(4)}`;
}
