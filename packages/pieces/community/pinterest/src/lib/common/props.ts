import {
  DropdownOption,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { fetchAllPages, isNonEmptyString, isRecord } from '.';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { pinterestAuth } from './auth';

export const boardIdDropdown = Property.Dropdown({
  auth: pinterestAuth,
  displayName: 'Board',
  required: true,
  refreshers: ['auth', 'ad_account_id'],
  options: async ({ auth, ad_account_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    try {
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const boards = await fetchAllPages({
        accessToken,
        path: isNonEmptyString(ad_account_id)
          ? `/boards?ad_account_id=${encodeURIComponent(ad_account_id)}`
          : '/boards',
      });

      const options = toNamedOptions(boards);

      if (options.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No boards found. Create one in Pinterest first.',
        };
      }

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
  auth: pinterestAuth,
  displayName: 'Pin',
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
      const pins = await fetchAllPages({ accessToken, path: '/pins' });
      const options = toPinOptions(pins);

      if (options.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No Pins found. Create one in Pinterest first.',
        };
      }

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
  auth: pinterestAuth,
  displayName: 'Ad Account',
  description: 'Only for ads accounts. Leave empty to use your own account.',
  required: false,
  advanced: true,
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
      const adAccounts = await fetchAllPages({
        accessToken,
        path: '/ad_accounts',
      });
      const options = toNamedOptions(adAccounts);

      if (options.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No ad accounts found on this Pinterest account.',
        };
      }

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
  auth: pinterestAuth,
  displayName: 'Board Section',
  description: 'Leave empty to save the Pin to the board itself.',
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
      const boardSections = await fetchAllPages({
        accessToken,
        path: `/boards/${board_id}/sections`,
      });
      const options = toNamedOptions(boardSections);

      if (options.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No sections found on this board.',
        };
      }

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
  auth: pinterestAuth,
  displayName: 'Product Tag Pins',
  description: 'Pins whose products to tag. Needs product tagging access.',
  required: false,
  advanced: true,
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
      const pins = await fetchAllPages({ accessToken, path: '/pins' });
      const options = toPinOptions(pins);

      if (options.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No Pins found. Create one in Pinterest first.',
        };
      }

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

function toNamedOptions(items: unknown[]): DropdownOption<string>[] {
  return items.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const id = item['id'];
    const name = item['name'];

    if (!isNonEmptyString(id)) {
      return [];
    }

    return [{ label: isNonEmptyString(name) ? name : id, value: id }];
  });
}

function toPinOptions(items: unknown[]): DropdownOption<string>[] {
  return items.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const id = item['id'];
    const title = item['title'];

    if (!isNonEmptyString(id)) {
      return [];
    }

    return [{ label: isNonEmptyString(title) ? title : id, value: id }];
  });
}
