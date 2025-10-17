import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const senderAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Enter your Sender API Token',
  required: true,
});

const SENDER_API_BASE_URL = 'https://api.sender.net/v2';

export async function makeSenderRequest(
  auth: string,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any
) {
  return await httpClient.sendRequest({
    method,
    url: `${SENDER_API_BASE_URL}${endpoint}`,
    headers: {
      Authorization: `Bearer ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
  });
}
export const groupIdDropdown = Property.Dropdown({
  displayName: 'Groups',
  description: 'Select one or more groups',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Sender account first',
      };
    }

    try {
      const response: any = await makeSenderRequest(
        auth as string,
        '/groups',
        HttpMethod.GET
      );
      const groups = response.body.data || [];

      return {
        disabled: false,
        options: groups.map((group: any) => ({
          label: group.title,
          value: group.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading groups',
      };
    }
  },
});

export const groupIdsDropdown = Property.MultiSelectDropdown({
  displayName: 'Groups',
  description: 'Select one or more groups',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Sender account first',
      };
    }

    try {
      const response: any = await makeSenderRequest(
        auth as string,
        '/groups',
        HttpMethod.GET
      );
      const groups = response.body.data || [];

      return {
        disabled: false,
        options: groups.map((group: any) => ({
          label: group.title,
          value: group.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading groups',
      };
    }
  },
});

export const subscribersDropdown = Property.MultiSelectDropdown<string>({
  displayName: 'Subscribers',
  description: 'Select one or more subscribers to delete',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Sender account first',
      };
    }

    try {
      const response: any = await makeSenderRequest(
        auth as string,
        '/subscribers?limit=50',
        HttpMethod.GET
      );
      const subscribers = response.body.data || [];

      return {
        disabled: false,
        options: subscribers.map((sub: any) => ({
          label: sub.email,
          value: sub.email,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading subscribers',
      };
    }
  },
});

export const subscriberDropdownSingle = Property.Dropdown<string>({
  displayName: 'Subscriber',
  description: 'Select a subscriber',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Sender account first',
      };
    }

    try {
      const response: any = await makeSenderRequest(
        auth as string,
        '/subscribers?limit=50',
        HttpMethod.GET
      );
      const subscribers = response.body.data || [];

      return {
        disabled: false,
        options: subscribers.map((sub: any) => ({
          label: sub.email,
          value: sub.email,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading subscribers',
      };
    }
  },
});

export const campaignDropdown = Property.Dropdown({
  displayName: 'Campaign',
  description: 'Select a campaign',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Sender account first',
      };
    }

    try {
      const response: any = await makeSenderRequest(
        auth as string,
        `/campaigns?limit=50&status=DRAFT`,
        HttpMethod.GET
      );
      const campaigns = response.body.data || [];

      return {
        disabled: false,
        options: campaigns.map((c: any) => ({
          label: c.title || c.subject || c.id,
          value: c.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading campaigns',
      };
    }
  },
});
