import {
  createAction,
  CustomAuthProperty,
  CustomAuthProps,
  Property,
} from '@activepieces/pieces-framework';
import { dustAuth, DustAuthType } from '../..';
import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

const DUST_BASE_URL = 'https://dust.tt/api/v1/w';
export const createConversation = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createConversation',
  displayName: 'Create conversation',
  description: '',
  auth: dustAuth,
  props: {
    assistant: Property.Dropdown({
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
            (agentConfiguration: {
              name: string;
              sId: string;
              scope: string;
            }) => {
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
    }),
    query: Property.LongText({ displayName: 'Query', required: true }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time zone',
      required: true,
      defaultValue: 'Europe/Paris',
    }),
  },
  async run({ auth, propsValue }) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${DUST_BASE_URL}/${auth.workspaceId}/assistant/conversations`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.apiKey}`,
      },
      body: JSON.stringify(
        {
          visibility: 'unlisted',
          title: null,
          message: {
            content: propsValue.query,
            mentions: [{ configurationId: propsValue.assistant }],
            context: {
              timezone: 'Europe/Paris',
              username: propsValue.username,
              email: null,
              fullName: null,
              profilePictureUrl: null,
            },
          },
        },
        (key, value) => (typeof value === 'undefined' ? null : value)
      ),
    };
    const body = (await httpClient.sendRequest(request)).body;
    const conversationId = body['conversation']['sId'];
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
    while (
      !['succeeded', 'errored'].includes(
        getConversationStatus(conversation.body)
      ) &&
      retries < 12 // 2mn
    ) {
      await new Promise((f) => setTimeout(f, 10000));

      conversation = await getConversation(conversationId);
      retries += 1;
    }

    if (getConversationStatus(conversation.body) != 'succeeded') {
      throw new Error('Could not load conversation');
    }

    return conversation.body;
  },
});

function getConversationStatus(conversation: HttpMessageBody): string {
  return conversation['conversation']['content']?.at(-1)?.at(0)?.status;
}
