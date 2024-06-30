import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { intercomAuth } from '../..';
import { intercomCommon } from '../common';

export const noteAddedToConversation = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'noteAddedToConversation',
  displayName: 'Note added to conversation',
  description: 'Triggers when a note is added to a conversation',
  props: {},
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
    return [context.payload.body];
  },
});
