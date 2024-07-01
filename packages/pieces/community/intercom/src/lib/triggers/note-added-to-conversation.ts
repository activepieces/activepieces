import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { stripHtml } from 'string-strip-html';
import { intercomAuth } from '../..';
import { intercomCommon } from '../common';

export const noteAddedToConversation = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'noteAddedToConversation',
  displayName: 'Note added to conversation',
  description: 'Triggers when a note is added to a conversation',
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword (optional)',
      required: false,
    }),
  },
  sampleData: {},
  auth: intercomAuth,
  type: TriggerStrategy.APP_WEBHOOK,
  async onEnable(context) {
    const response = await httpClient.sendRequest({
      url: 'https://api.intercom.io/me',
      method: HttpMethod.GET,
      headers: intercomCommon.intercomHeaders,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: getAccessTokenOrThrow(context.auth),
      },
    });

    context.app.createListeners({
      events: ['conversation.admin.noted'],
      identifierValue: response.body['app']['id_code'],
    });
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    const keyword = context.propsValue.keyword;
    const payloadBody = context.payload.body as IntercomPayloadBodyType;
    if (
      !keyword ||
      payloadBody?.data?.item?.conversation_parts.conversation_parts.some(
        (part) => stripHtml(part.body).result.split(/\s/).some((word) => word === keyword)
      )
    ) {
      return [payloadBody];
    }
    return [];
  },
});

type IntercomPayloadBodyType = {
  data: {
    item: {
      conversation_parts: {
        conversation_parts: {
          body: string;
        }[];
      };
    };
  };
};
