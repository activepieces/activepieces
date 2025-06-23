import { Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { DustAuthType } from '..';

export const DUST_BASE_URL = 'https://dust.tt/api/v1/w';

export const assistantProp = Property.Dropdown({
  displayName: 'Agent',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please authenticate first',
      };
    }
    const { workspaceId, apiKey } = auth as DustAuthType;
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${DUST_BASE_URL}/${workspaceId}/assistant/agent_configurations`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };
    const response = await httpClient.sendRequest(request);
    const options = response.body['agentConfigurations']
      ?.filter(
        (agentConfiguration: { status: string }) =>
          agentConfiguration.status === 'active'
      )
      ?.map(
        (agentConfiguration: { name: string; sId: string; scope: string }) => {
          return {
            label: `[${agentConfiguration['scope']}] ${agentConfiguration['name']}`,
            value: agentConfiguration['sId'],
          };
        }
      )
      ?.sort((a: { label: string }, b: { label: string }) =>
        a['label'].localeCompare(b['label'])
      );
    return {
      options: options,
    };
  },
});

export const usernameProp = Property.ShortText({
  displayName: 'Username',
  required: true,
});
export const timezoneProp = Property.ShortText({
  displayName: 'Time zone',
  required: true,
  defaultValue: 'Europe/Paris',
});
export const timeoutProp = Property.Number({
  displayName: 'Timeout (seconds)',
  required: true,
  defaultValue: 120,
});

export async function getConversationContent(
  conversationId: string,
  timeout: number,
  auth: DustAuthType
) {
  const getConversation = async (conversationId: string) => {
    return httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DUST_BASE_URL}/${auth.workspaceId}/assistant/conversations/${conversationId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.apiKey}`,
      },
    });
  };

  let conversation = await getConversation(conversationId);

  let retries = 0;
  const maxRetries = timeout / 10;
  while (
    !['succeeded', 'failed'].includes(
      getConversationStatus(conversation.body)
    ) &&
    retries < maxRetries
  ) {
    await new Promise((f) => setTimeout(f, 10000));

    conversation = await getConversation(conversationId);
    retries += 1;
  }

  const conversationStatus = getConversationStatus(conversation.body);
  if (conversationStatus != 'succeeded') {
    if (retries >= maxRetries) {
      throw new Error(
        `Could not load conversation ${conversationId} after ${timeout}s - ${conversationStatus} - consider increasing timeout value`
      );
    } else {
      throw new Error(
        `Could not load conversation ${conversationId} - ${conversationStatus}: ${
          conversation.body['conversation']['content']?.at(-1)?.at(0)?.error
        }`
      );
    }
  }

  return conversation.body;
}

function getConversationStatus(conversation: HttpMessageBody): string {
  return conversation['conversation']['content']?.at(-1)?.at(0)?.status;
}
