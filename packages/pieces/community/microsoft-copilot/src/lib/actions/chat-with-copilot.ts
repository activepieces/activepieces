import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365CopilotAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const chatWithCopilot = createAction({
  auth: microsoft365CopilotAuth,
  name: 'chatWithCopilot',
  displayName: 'Chat with Copilot',
  description:
    'Send a message to an existing Copilot conversation or creating a new one and get a response',
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description:
        'The ID of an existing conversation. If not provided, a new conversation will be created.',
      required: false,
    }),
    messageText: Property.LongText({
      displayName: 'Message Text',
      required: true,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'User location time zone in IANA format (e.g., America/New_York, Europe/London)',
      required: true,
      defaultValue: 'UTC',
    }),
    // additionalContext: Property.Json({
    //   displayName: 'Additional Context (optional)',
    //   description:
    //     'Array of context objects with "text" and optional "description" properties',
    //   required: false,
    // }),
    // contextFiles: Property.Json({
    //   displayName: 'Context Files (optional)',
    //   description:
    //     'Array of file objects with "uri" property pointing to OneDrive/SharePoint files',
    //   required: false,
    // }),
    enableWebSearch: Property.Checkbox({
      displayName: 'Enable Web Search Grounding',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      conversationId,
      messageText,
      timeZone,
      // additionalContext,
      // contextFiles,
      enableWebSearch,
    } = context.propsValue;

    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const createResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://graph.microsoft.com/beta/copilot/conversations',
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {}
      });
      
      activeConversationId = createResponse.body.id;
    }

    const locationHint: any = {
      timeZone: timeZone,
    };

    const body: any = {
      message: {
        text: messageText,
      },
      locationHint,
    };

    // if (
    //   additionalContext &&
    //   Array.isArray(additionalContext) &&
    //   additionalContext.length > 0
    // ) {
    //   body.additionalContext = additionalContext;
    // }

    const contextualResources: any = {};

    // if (
    //   contextFiles &&
    //   Array.isArray(contextFiles) &&
    //   contextFiles.length > 0
    // ) {
    //   contextualResources.files = contextFiles as any;
    // }

    if (enableWebSearch !== undefined) {
      contextualResources.webContext = {
        isWebEnabled: enableWebSearch,
      } as any;
    }

    if (Object.keys(contextualResources).length > 0) {
      body.contextualResources = contextualResources as any;
    }

    const response: any = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://graph.microsoft.com/beta/copilot/conversations/${activeConversationId}/chat`,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response.body.messages[1];
  },
});
