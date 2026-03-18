import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const createInbox = createAction({
  auth: lobstermailAuth,
  name: 'create_inbox',
  displayName: 'Create Inbox',
  description: 'Create a new email inbox on LobsterMail',
  props: {
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Human-friendly name for the inbox',
      required: false,
    }),
    localPart: Property.ShortText({
      displayName: 'Local Part',
      description:
        'Local part of the email address (before @). Auto-generated if omitted.',
      required: false,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Domain for the inbox (defaults to lobstermail.ai)',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, string> = {};
    if (context.propsValue.displayName)
      body['displayName'] = context.propsValue.displayName;
    if (context.propsValue.localPart)
      body['localPart'] = context.propsValue.localPart;
    if (context.propsValue.domain) body['domain'] = context.propsValue.domain;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
