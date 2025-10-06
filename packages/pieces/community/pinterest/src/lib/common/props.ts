import {
  DropdownOption,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { makeRequest } from '.';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

export const boardIdDropdown = Property.Dropdown({
  displayName: 'Board Id',
  required: true,
  refreshers: ['ad_account_id'],
  options: async ({ auth, ad_account_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    try {
      const url = new URL('/boards', 'https://api.pinterest.com/v5');
      if (ad_account_id) {
        url.searchParams.append('ad_account_id', ad_account_id as string);
      }

      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const boards = await makeRequest(
        accessToken,
        HttpMethod.GET,
        url.pathname + url.search
      );

      const options: DropdownOption<string>[] = boards.items.map(
        (board: any) => ({
          label: board.name,
          value: board.id,
        })
      );

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading boards. Please try again.',
        options: [],
      };
    }
  },
});

export const pinIdDropdown = Property.Dropdown({
  displayName: 'pin Id',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    try {
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const pins = await makeRequest(accessToken, HttpMethod.GET, '/pins');

      const options: DropdownOption<string>[] = pins.items.map((pin: any) => ({
        label: pin.title,
        value: pin.id,
      }));

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading pins. Please try again.',
        options: [],
      };
    }
  },
});

export const adAccountIdDropdown = Property.Dropdown({
  displayName: 'Ad account Id',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    try {
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const adAccounts = await makeRequest(
        accessToken,
        HttpMethod.GET,
        '/ad_accounts'
      );

      const options: DropdownOption<string>[] = adAccounts.items.map(
        (account: any) => ({
          label: account.name,
          value: account.id,
        })
      );

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading ad accounts. Please try again.',
        options: [],
      };
    }
  },
});

export const boardSectionIdDropdown = Property.Dropdown({
  displayName: 'Board Section Id',
  required: false,
  refreshers: ['auth', 'board_id'],
  options: async ({ auth, board_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    if (!board_id) {
      return {
        disabled: true,
        placeholder: 'Please select a board first',
        options: [],
      };
    }

    try {
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const boardsections = await makeRequest(
        accessToken,
        HttpMethod.GET,
        `/boards/${board_id}/sections`
      );

      const options: DropdownOption<string>[] = boardsections.items.map(
        (section: any) => ({
          label: section.name,
          value: section.id,
        })
      );

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading board sections. Please try again.',
        options: [],
      };
    }
  },
});

export const pinIdMultiSelectDropdown = Property.MultiSelectDropdown({
  displayName: 'Product Tags',
  description: 'Select one or more options',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    try {
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const pins = await makeRequest(accessToken, HttpMethod.GET, '/pins');

      const options: DropdownOption<string>[] = pins.items.map((pin: any) => ({
        label: pin.title,
        value: pin.id,
      }));

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading pins. Please try again.',
        options: [],
      };
    }
  },
});
