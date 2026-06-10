import { afforaiAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

export const askChatbotAction = createAction({
  auth: afforaiAuth,
  name: 'afforai_ask_chatbot',
  displayName: 'Ask Chatbot',
  description: 'Gets AI-generated completions using the Afforai chat completion API.',
  props: {
    foundation_model: Property.StaticDropdown({
      displayName: 'Foundation Model',
      required: true,
      description: 'The AI model to use for completion.',
      options: {
        disabled: false,
        options: [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
        ],
      },
    }),
    system: Property.LongText({
      displayName: 'System Prompt',
      required: false,
      description: 'Optional system-level instruction for the AI.',
    }),
    history: Property.Array({
      displayName: 'Chat History',
      required: true,
      properties: {
        role: Property.StaticDropdown({
          displayName: 'Role',
          description: 'The role of the message sender.',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'user', value: 'user' },
              { label: 'assistant', value: 'assistant' },
            ],
          },
        }),
        content: Property.LongText({
          displayName: 'Message',
          description: 'The content of the message.',
          required: true,
        }),
      },
    }),
    tool: Property.StaticDropdown({
      displayName: 'Tool',
      required: true,
      description: 'The retrieval tool to use.',
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'none' },
          { label: 'Document Retrieval', value: 'doc_retrieval' },
          { label: 'Google Search', value: 'google' },
          { label: 'Semantic Scholar', value: 'semantic_scholar' },
        ],
      },
    }),
    file_ids: Property.Array({
      displayName: 'File IDs (doc_retrieval only)',
      required: false,
      description:
        'List of file IDs to retrieve from. Leave empty to search across all uploaded files. Only used when Tool is set to Document Retrieval.',
    }),
  },
  async run(context) {
    const { foundation_model, system, history, tool, file_ids } =
      context.propsValue;

    const tool_config: Record<string, unknown> = {};
    if (
      tool === 'doc_retrieval' &&
      file_ids &&
      (file_ids as string[]).length > 0
    ) {
      tool_config['file_ids'] = file_ids;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.afforai.com/completion',
      headers: {
        'x-access-token': context.auth as string,
        'Content-Type': 'application/json',
      },
      body: {
        foundation_model,
        ...(system ? { system } : {}),
        history: history as ChatHistory[],
        tool,
        ...(Object.keys(tool_config).length > 0 ? { tool_config } : {}),
      },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});

type ChatHistory = {
  role: string;
  content: string;
};
