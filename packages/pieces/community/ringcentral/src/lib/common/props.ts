import { HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';

import { ringcentralAuth } from './auth';
import { ringcentralCommon } from './client';

/**
 * The numbers this extension may actually send SMS from.
 *
 * RingCentral accepts a `from` number only when it is assigned to the extension behind the token AND
 * carries the `SmsSender` feature. A number assigned for caller ID only comes back with
 * `features: ['CallerId']` and is refused at send time with `MSG-242 FeatureNotAvailable`. On a real
 * account most numbers are not SMS senders, so a free-text field means picking wrong is the default
 * outcome and the error arrives only once the flow runs.
 */
export const smsFromNumberDropdown = Property.Dropdown({
  auth: ringcentralAuth,
  displayName: 'From',
  description: 'The SMS-enabled RingCentral number to send from.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return notConnected();
    }

    const response = await ringcentralCommon.sendRequest<PagedRecords<PhoneNumberRecord>>({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.GET,
      resourcePath: '/restapi/v1.0/account/~/extension/~/phone-number',
      // The documented maximum. An extension with more direct numbers than this is not a shape worth
      // paging a dropdown for, and the SMS senders among them are a small subset anyway.
      queryParams: { perPage: '1000' },
    });

    const senders = (response.records ?? []).filter((record) =>
      (record.features ?? []).includes('SmsSender'),
    );

    if (senders.length === 0) {
      return {
        disabled: true,
        // Distinguishes "nothing is SMS-enabled" from "the lookup failed", which look identical in an
        // empty dropdown and send the reader to the wrong place.
        placeholder:
          'No SMS-enabled numbers on this extension. Enable SMS on a number in the RingCentral admin portal.',
        options: [],
      };
    }

    return {
      disabled: false,
      options: senders.map((record) => ({
        label: record.usageType ? `${record.phoneNumber} (${record.usageType})` : record.phoneNumber,
        value: record.phoneNumber,
      })),
    };
  },
});

/**
 * Team Messaging conversations, so posting does not require pasting a raw chat id.
 */
export const chatDropdown = Property.Dropdown({
  auth: ringcentralAuth,
  displayName: 'Chat',
  description: 'The direct message, group or team to post to.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return notConnected();
    }

    const chats = await listAllChats(auth as OAuth2PropertyValue);

    return {
      disabled: false,
      options: chats.map((chat) => ({
        label: chat.name ?? `${chat.type ?? 'Chat'} (${chat.id})`,
        value: chat.id,
      })),
    };
  },
});

function notConnected() {
  return {
    disabled: true,
    placeholder: 'Connect your account first',
    options: [],
  };
}

/**
 * Follows the page tokens rather than reading the first page only.
 *
 * A single request caps at 250, and an account past that would silently be missing exactly the chats
 * a user could not then select, with no hint that the list was truncated. The page cap stops a
 * pathological account from hanging the dropdown; it is high enough that reaching it means the list
 * was never going to be usable as a dropdown anyway.
 */
async function listAllChats(auth: OAuth2PropertyValue): Promise<ChatRecord[]> {
  const MAX_PAGES = 10;
  const collected: ChatRecord[] = [];
  let pageToken: string | undefined = undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const queryParams: Record<string, string> = { recordCount: '250' };
    if (pageToken) queryParams['pageToken'] = pageToken;

    const response: TokenPagedRecords<ChatRecord> =
      await ringcentralCommon.sendRequest<TokenPagedRecords<ChatRecord>>({
        auth,
        method: HttpMethod.GET,
        resourcePath: '/team-messaging/v1/chats',
        queryParams,
      });

    collected.push(...(response.records ?? []));

    pageToken = response.navigation?.nextPageToken;
    if (!pageToken) break;
  }

  return collected;
}

type PhoneNumberRecord = {
  phoneNumber: string;
  usageType?: string;
  features?: string[];
};

type ChatRecord = {
  id: string;
  name?: string;
  type?: string;
};

type PagedRecords<T> = { records?: T[] };

type TokenPagedRecords<T> = {
  records?: T[];
  navigation?: { nextPageToken?: string };
};
