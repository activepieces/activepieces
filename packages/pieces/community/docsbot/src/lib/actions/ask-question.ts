import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { docsbotCommon } from '../common/dropdown';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { randomUUID } from 'crypto';

export const askQuestion = createAction({
  auth: DocsBotAuth,
  name: 'askQuestion',
  displayName: 'Ask Question',
  description: 'Ask a question to a specific bot and get an answer based on its sources.',
  props: {
    teamId: docsbotCommon.teamId,
    botId: docsbotCommon.botId,
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      required: false,
      description:
        'UUID for maintaining conversation context. Leave empty to auto-generate a new one.',
    }),
    question: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    userName: Property.ShortText({
      displayName: 'User Name',
      required: false,
      description: 'Optional: Name of the user asking the question',
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      required: false,
      description: 'Optional: Email of the user asking the question',
    }),
    contextItems: Property.Number({
      displayName: 'Number of Sources to Lookup',
      required: false,
      defaultValue: 5,
      description: 'Number of sources the bot should look up to answer the question',
    }),
    model: Property.ShortText({
      displayName: 'Model',
      required: false,
      description: 'Optional: Override the model used for this request, e.g., gpt-4o',
    }),
    defaultLanguage: Property.ShortText({
      displayName: 'Default Language',
      required: false,
      description: 'Optional: Default language of conversation, e.g., en or en-US',
    }),
    reasoningEffort: Property.ShortText({
      displayName: 'Reasoning Effort',
      required: false,
      description: "Optional: 'minimal', 'low', 'medium', 'high'",
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      required: false,
      description: 'Optional: Image URLs to include as context',
    }),
  },
  async run({ auth, propsValue }) {
    const {
      teamId,
      botId,
      question,
      userName,
      userEmail,
      contextItems,
      model,
      defaultLanguage,
      reasoningEffort,
      imageUrls,
    } = propsValue;

    const conversationId = propsValue.conversationId ?? randomUUID();

    const requestBody = {
      conversationId,
      question,
      metadata: {
        name: userName ?? 'Anonymous',
        email: userEmail ?? '',
      },
      context_items: contextItems ?? 5,
      human_escalation: false,
      followup_rating: false,
      document_retriever: true,
      full_source: false,
      stream: false,
      autocut: false,
      testing: false,
      image_urls: imageUrls ?? [],
      model: model ?? undefined,
      default_language: defaultLanguage ?? undefined,
      reasoning_effort: reasoningEffort ?? undefined,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.docsbot.ai/teams/${teamId}/bots/${botId}/chat-agent`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
});
