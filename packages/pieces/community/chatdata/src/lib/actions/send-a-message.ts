import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { chatbotIdDropdown, conversationIdDropdown } from '../common/dropdown';

export const sendAMessage = createAction({
  auth: ChatDataAuth,
  name: 'sendAMessage',
  displayName: 'Send a Message',
  description: 'send a message to the chatbot and get response ',
  props: {
    chatbotId: chatbotIdDropdown,
    conversationId: conversationIdDropdown,
    messages: Property.Array({
      displayName: "Messages",
      description:
        "List of messages in the conversation. Each message must have a role and content.",
      required: true,
      properties: {
        role: Property.StaticDropdown({
          displayName: "Role",
          required: true,
          options: {
            options: [
              { value: "user", label: "User" },
              { value: "assistant", label: "Assistant" },
            ],
          },
        }),
        content: Property.LongText({
          displayName: "Content",
          required: true,
        }),
      },
    }),

    includeReasoning: Property.Checkbox({
      displayName: "Include Reasoning",
      description:
        "If true, reasoning is included in the response inside {reasoning}{response}",
      required: false,
    }),

    baseModel: Property.StaticDropdown({
      displayName: "Base Model",
      description: "Overrides the chatbot's baseModel for this response.",
      required: false,
      options: {
        options: [
          { value: "gpt-4o-mini", label: "GPT-4o Mini" },
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gpt-4", label: "GPT-4" },
          { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
          { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
          { value: "gpt-4.1", label: "GPT-4.1" },
          { value: "gpt-5-nano", label: "GPT-5 Nano" },
          { value: "gpt-5-mini", label: "GPT-5 Mini" },
          { value: "gpt-5", label: "GPT-5" },
          { value: "gpt-o1", label: "GPT-o1" },
          { value: "gpt-o3-mini", label: "GPT-o3 Mini" },
          { value: "gpt-o3", label: "GPT-o3" },
          { value: "gpt-o4-mini", label: "GPT-o4 Mini" },
          { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
          { value: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet" },
          { value: "claude-4-sonnet", label: "Claude 4 Sonnet" },
          { value: "claude-4-5-sonnet", label: "Claude 4.5 Sonnet" },
          { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku" },
          { value: "claude-3-haiku", label: "Claude 3 Haiku" },
          { value: "claude-4-opus", label: "Claude 4 Opus" },
          { value: "claude-4.1-opus", label: "Claude 4.1 Opus" },
          { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
          { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
          { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
          { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
          { value: "deepseek-r1", label: "DeepSeek R1" },
        ],
      },
    }),

    basePrompt: Property.LongText({
      displayName: "Base Prompt",
      description: "Overrides the chatbot's basePrompt for this response.",
      required: false,
    }),

    stream: Property.Checkbox({
      displayName: "Stream Response",
      description:
        "If true, response will be streamed back as chunks. Otherwise, full JSON is returned.",
      required: false,
      defaultValue: false,
    }),

    openAIFormat: Property.Checkbox({
      displayName: "OpenAI Format",
      description:
        "If true, responses are in OpenAI-compatible chat/completions format.",
      required: false,
      defaultValue: false,
    }),

    appendMessages: Property.Checkbox({
      displayName: "Append Messages",
      description:
        "If true, messages are appended to the previous messages with the same conversationId.",
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const {
      chatbotId,
      conversationId,
      messages,
      includeReasoning,
      baseModel,
      basePrompt,
      stream,
      openAIFormat,
      appendMessages,
    } = context.propsValue;

    const body: any = {
      chatbotId,
      messages,
      includeReasoning,
      baseModel,
      basePrompt,
      stream,
      openAIFormat,
      appendMessages,
    };

    if (conversationId) {
      body.conversationId = conversationId;
    }

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      "/chat",
      body
    );

    return response;
  },
});