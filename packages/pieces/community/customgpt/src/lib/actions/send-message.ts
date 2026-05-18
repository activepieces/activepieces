import { createAction, Property } from '@activepieces/pieces-framework';
import { customgptAuth } from '../common/auth';
import { projectId } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendMessage = createAction({
  auth: customgptAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description: 'Send a message to a conversation within an agent',
  props: {
    project_id: projectId,
    session_id: Property.ShortText({
      displayName: 'Session ID',
      description: 'The session ID of the conversation',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The message/question to send',
      required: true,
    }),
    stream: Property.Checkbox({
      displayName: 'Enable Streaming',
      description: 'Stream the response in real-time (default: false)',
      required: false,
      defaultValue: false,
    }),
    custom_persona: Property.LongText({
      displayName: 'Custom Persona',
      description: 'Custom persona/instructions for the agent (optional)',
      required: false,
    }),
    chatbot_model: Property.StaticDropdown({
      displayName: 'Agent Model',
      description: 'AI model to use for the conversation (optional)',
      required: false,
      options: {
        options: [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20240620' },
          { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
          { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
          { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
          { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
          { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
          { label: 'o1-preview', value: 'o1-preview' },
        ],
      },
    }),
    response_source: Property.StaticDropdown({
      displayName: 'Response Source',
      description:
        'Source for generating responses (default: use only your content)',
      required: false,
      defaultValue: 'default',
      options: {
        options: [
          { label: 'Default (Your Content Only)', value: 'default' },
          { label: 'Own Content', value: 'own_content' },
          { label: 'OpenAI Content (Can improvise)', value: 'openai_content' },
        ],
      },
    }),
    agent_capability: Property.StaticDropdown({
      displayName: 'Agent Capability',
      description: 'Capability mode for the agent (default: fastest-responses)',
      required: false,
      defaultValue: 'fastest-responses',
      options: {
        options: [
          { label: 'Fastest Responses', value: 'fastest-responses' },
          { label: 'Optimal Choice', value: 'optimal-choice' },
          { label: 'Advanced Reasoning', value: 'advanced-reasoning' },
          { label: 'Complex Tasks', value: 'complex-tasks' },
        ],
      },
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'Language code for the prompt (default: en)',
      required: false,
      defaultValue: 'en',
    }),
    custom_context: Property.LongText({
      displayName: 'Custom Context',
      description: 'Additional context for the conversation (optional)',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description:
        'File to upload with the message (Max 5MB: pdf, docx, doc, odt, txt, jpg, jpeg, png, webp)',
      required: false,
    }),
  },
  async run(context) {
    const {
      project_id,
      session_id,
      prompt,
      stream,
      custom_persona,
      chatbot_model,
      response_source,
      agent_capability,
      lang,
      custom_context,
      file,
    } = context.propsValue;

    const queryParams: any = {
      stream: stream ? 'true' : 'false',
    };
    if (lang) queryParams.lang = lang;

    const body: any = {
      prompt,
    };

    if (custom_persona) body.custom_persona = custom_persona;
    if (chatbot_model) body.chatbot_model = chatbot_model;
    if (response_source) body.response_source = response_source;
    if (agent_capability) body.agent_capability = agent_capability;
    if (custom_context) body.custom_context = custom_context;
    if (file) body.file = file;

    const queryString = '?' + new URLSearchParams(queryParams).toString();

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/projects/${project_id}/conversations/${session_id}/messages${queryString}`,
      body
    );

    return response;
  },
});
