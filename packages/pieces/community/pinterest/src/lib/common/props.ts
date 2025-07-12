import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '.';
import { HttpMethod } from '@activepieces/pieces-common';

export const boardIdDropdown = Property.Dropdown({
  displayName: 'board Id',
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
    let path = '/boards';
    if (ad_account_id) {
      path = `/boards?ad_account_id=${ad_account_id}`;
    }
    const apiKey = auth as string;
    const boards = await makeRequest(apiKey, HttpMethod.GET, path);

    const options: DropdownOption<string>[] = boards.items.map((board: any) => ({
      label: board.name,
      value: board.id,
    }));

    return {
      disabled: false,
      options,
    };
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

    const apiKey = auth as string;
    const pins = await makeRequest(apiKey, HttpMethod.GET, '/pins');

    const options: DropdownOption<string>[] = pins.items.map((pin: any) => ({
      label: pin.title,
      value: pin.id,
    }));

    return {
      disabled: false,
      options,
    };
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

    const apiKey = auth as string;
    const adAccounts = await makeRequest(
      apiKey,
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

    const apiKey = auth as string;
    const boardsections = await makeRequest(
      apiKey,
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
  },
});


export const pinIdMultiSelectDropdown = Property.MultiSelectDropdown({
  displayName: 'Options',
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

    const apiKey = auth as string;
    const pins = await makeRequest(apiKey, HttpMethod.GET, '/pins');

    const options: DropdownOption<string>[] = pins.items.map((pin: any) => ({
      label: pin.title,
      value: pin.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
})