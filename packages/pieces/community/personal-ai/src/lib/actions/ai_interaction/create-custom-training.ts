import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL, personalAiAuth } from '../../../index';

export const createCustomTraining = createAction({
  auth:personalAiAuth,
  name: 'create_custom_training',
  displayName: 'Send Custom Training',
  description: 'Send a custom training instruction to AI assistant.',
  // category: 'AI Interaction',
  props: {
    text: Property.LongText({
      displayName: 'Training Text',
      description: 'The training instruction or prompt to send',
      required: true,
    }),
    context: Property.LongText({
      displayName: 'Context',
      description: 'Additional context for the AI response',
      required: false,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain identifier for the AI profile',
      required: false,
    }),
    userName: Property.ShortText({
      displayName: 'User Name',
      description: 'Name of the user sending the request',
      required: false,
    }),
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'Use the same sessionId to continue conversation on that session',
      required: false,
    }),
    sourceName: Property.ShortText({
      displayName: 'Source Name',
      description: 'Name of the source app of the inbound training',
      required: false,
    }),
    isStack: Property.Checkbox({
      displayName: 'Add to Memory',
      description: 'Flag to also add the training instruction to memory',
      required: false,
      defaultValue: false,
    }),
    isDraft: Property.Checkbox({
      displayName: 'Create Draft',
      description: 'Flag to create a copilot message for the AI',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue: { text, context: messageContext, domainName, userName, sessionId, sourceName, isStack, isDraft } } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/v1/training?cmd=custom`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': auth as string,
      },
      body: {
        Text: text,
        ...(messageContext && { Context: messageContext }),
        ...(domainName && { DomainName: domainName }),
        ...(userName && { UserName: userName }),
        ...(sessionId && { SessionId: sessionId }),
        ...(sourceName && { SourceName: sourceName }),
        ...(isStack !== undefined && { is_stack: isStack }),
        ...(isDraft !== undefined && { is_draft: isDraft }),
      },
    });

    return response.body;
  },
});
