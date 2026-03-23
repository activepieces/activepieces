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
  description: 'Create a new email inbox on LobsterMail.',
  props: {
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'A friendly label for the inbox (e.g. "Support Inbox"). Only visible inside LobsterMail.',
      required: false,
    }),
    localPart: Property.ShortText({
      displayName: 'Email Username',
      description:
        'The part before the @ in the email address (e.g. "support" → support@lobstermail.ai). ' +
        'Use only lowercase letters, numbers, dots, hyphens, or underscores. Leave empty to auto-generate a random address.',
      required: false,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description:
        'The domain for the inbox address. Leave empty to use the default lobstermail.ai. ' +
        'Custom domains require a Tier 2+ account and prior DNS configuration.',
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

    const response = await httpClient.sendRequest<{
      id: string;
      address: string;
      localPart: string;
      domain: string;
      displayName?: string;
      active: boolean;
      createdAt: string;
    }>({
      method: HttpMethod.POST,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    const inbox = response.body;
    return {
      id: inbox.id,
      address: inbox.address,
      local_part: inbox.localPart,
      domain: inbox.domain,
      display_name: inbox.displayName ?? null,
      active: inbox.active,
      created_at: inbox.createdAt,
    };
  },
});
