import { HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { ringcentralApiCall } from './client';

type PhoneNumberRecord = {
  phoneNumber: string;
  usageType: string;
  features?: string[];
};

type ChatRecord = {
  id: string;
  name?: string;
  type: string;
  members?: string[];
};

type PersonRecord = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type ListResponse<T> = { records: T[] };

const NOT_CONNECTED = {
  disabled: true,
  placeholder: 'Connect your account first',
  options: [],
};

/**
 * Numbers the authenticated extension may send from.
 *
 * RingCentral only accepts a `from` number that is assigned to the extension
 * behind the token AND carries the `SmsSender` feature. Numbers assigned for
 * caller ID only are rejected at send time with `MSG-242 FeatureNotAvailable`,
 * so they are filtered out here rather than offered and failed later.
 */
export const smsFromNumberDropdown = Property.Dropdown({
  displayName: 'From',
  description: 'The SMS-enabled phone number to send the message from',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return NOT_CONNECTED;
    }

    const response = await ringcentralApiCall<ListResponse<PhoneNumberRecord>>({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.GET,
      resourceUri: '/restapi/v1.0/account/~/extension/~/phone-number',
      queryParams: { perPage: '1000' },
    });

    const smsCapableNumbers = (response.records ?? []).filter((record) =>
      (record.features ?? []).includes('SmsSender')
    );

    return {
      disabled: false,
      options: smsCapableNumbers.map((record) => ({
        label: `${record.phoneNumber} (${record.usageType})`,
        value: record.phoneNumber,
      })),
    };
  },
});

export const chatDropdown = Property.Dropdown({
  displayName: 'Chat',
  description: 'The Team Messaging chat (direct message, group, or team) to post to',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return NOT_CONNECTED;
    }

    const response = await ringcentralApiCall<ListResponse<ChatRecord>>({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.GET,
      resourceUri: '/team-messaging/v1/chats',
      queryParams: { recordCount: '100' },
    });

    return {
      disabled: false,
      options: (response.records ?? []).map((chat) => ({
        label: chat.name ?? `${chat.type} chat (${chat.id})`,
        value: chat.id,
      })),
    };
  },
});

export const chatAssigneesDropdown = Property.MultiSelectDropdown({
  displayName: 'Assignees',
  description: 'Members of the selected chat to assign the task to',
  required: false,
  refreshers: ['chatId'],
  options: async ({ auth, chatId }) => {
    if (!auth || !chatId) {
      return {
        disabled: true,
        placeholder: !auth ? 'Connect your account first' : 'Select a chat first',
        options: [],
      };
    }

    const chat = await ringcentralApiCall<ChatRecord>({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.GET,
      resourceUri: `/team-messaging/v1/chats/${chatId}`,
    });

    const memberIds = chat.members ?? [];
    const members = await Promise.all(
      memberIds.map((id) =>
        ringcentralApiCall<PersonRecord>({
          auth: auth as OAuth2PropertyValue,
          method: HttpMethod.GET,
          resourceUri: `/team-messaging/v1/persons/${id}`,
        }).catch(() => ({ id } as PersonRecord))
      )
    );

    return {
      disabled: false,
      options: members.map((person) => ({
        label:
          [person.firstName, person.lastName].filter(Boolean).join(' ') ||
          person.email ||
          person.id,
        value: person.id,
      })),
    };
  },
});
