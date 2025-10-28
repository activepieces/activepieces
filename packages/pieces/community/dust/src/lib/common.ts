import { Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
} from '@activepieces/pieces-common';
import { DustAuthType } from '..';
import { DustAPI } from '@dust-tt/client';

export const DUST_BASE_URL = {
  us: 'https://dust.tt/api/v1/w',
  eu: 'https://eu.dust.tt/api/v1/w',
};

export const createClient = (auth: DustAuthType) => {
  return new DustAPI(
    { url: auth.region === 'eu' ? 'https://eu.dust.tt' : 'https://dust.tt' },
    {
      workspaceId: auth.workspaceId,
      apiKey: auth.apiKey,
    },
    console
  );
};

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
    const client = createClient(auth as DustAuthType);
    const response = await client.getAgentConfigurations({});

    if (response.isErr()) {
      throw new Error(`API Error: ${response.error.message}`);
    }

    const options = response.value
      .filter((agentConfiguration) => agentConfiguration.status === 'active')
      .map((agentConfiguration) => {
        return {
          label: `[${agentConfiguration['scope']}] ${agentConfiguration['name']}`,
          value: agentConfiguration['sId'],
        };
      })
      .sort((a: { label: string }, b: { label: string }) =>
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
      url: `${DUST_BASE_URL[auth.region || 'us']}/${
        auth.workspaceId
      }/assistant/conversations/${conversationId}`,
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
      const error = getConversationError(conversation.body);
      throw new Error(
        `Could not load conversation ${conversationId} - ${conversationStatus}: ${error.message} (${error.code})`
      );
    }
  }

  return conversation.body;
}

function getConversationStatus(conversation: HttpMessageBody): string {
  return conversation['conversation']['content']?.at(-1)?.at(0)?.status;
}

function getConversationError(conversation: HttpMessageBody): {
  code: string;
  message: string;
} {
  return conversation['conversation']['content']?.at(-1)?.at(0)?.error;
}
