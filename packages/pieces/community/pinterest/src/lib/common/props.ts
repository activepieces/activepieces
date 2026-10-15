import {
  DropdownOption,
  DropdownState,
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
  refreshOnSearch: true,
  options: async ({ auth, ad_account_id }, ctx) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    const search = ctx.searchValue?.trim() ?? '';

    try {
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const adAccountId = toAdAccountId(ad_account_id);
      const boards =
        search.length > 0
          ? await fetchAllPages({
              accessToken,
              path: buildSearchPath({
                resource: 'boards',
                search,
                adAccountId,
              }),
              pageSize: null,
            })
          : await fetchAllPages({
              accessToken,
              path:
                adAccountId.length > 0
                  ? `/boards?ad_account_id=${encodeURIComponent(adAccountId)}`
                  : '/boards',
            });

      const options = toNamedOptions(boards.items);

      return toDropdownState({
        options,
        truncated: boards.truncated,
        emptyPlaceholder:
          search.length > 0
            ? `No boards match "${search}".`
            : 'No boards found. Create one in Pinterest first.',
        truncatedPlaceholder:
          search.length > 0
            ? `Showing the first ${options.length} matches. Refine your search.`
            : `Showing the first ${options.length} boards. Type to search.`,
      });
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
  refreshers: ['auth', 'ad_account_id'],
  refreshOnSearch: true,
  options: async ({ auth, ad_account_id }, ctx) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    const search = ctx.searchValue?.trim() ?? '';

    try {
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const adAccountId = toAdAccountId(ad_account_id);
      const pins = await fetchPins({ accessToken, search, adAccountId });
      const options = toPinOptions(pins.items);

      return toDropdownState({
        options,
        truncated: pins.truncated,
        emptyPlaceholder:
          search.length > 0
            ? `No Pins match "${search}".`
            : 'No Pins found. Create one in Pinterest first.',
        truncatedPlaceholder:
          search.length > 0
            ? `Showing the first ${options.length} matches. Refine your search.`
            : `Showing the first ${options.length} Pins. Type to search.`,
      });
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
        maxPages: 10,
      });
      const options = toNamedOptions(adAccounts.items);

      return toDropdownState({
        options,
        truncated: adAccounts.truncated,
        emptyPlaceholder: 'No ad accounts found on this Pinterest account.',
        truncatedPlaceholder: `Showing the first ${options.length} ad accounts. Type to filter.`,
      });
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
        maxPages: 10,
      });
      const options = toNamedOptions(boardSections.items);

      return toDropdownState({
        options,
        truncated: boardSections.truncated,
        emptyPlaceholder: 'No sections found on this board.',
        truncatedPlaceholder: `Showing the first ${options.length} sections. Type to filter.`,
      });
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
  refreshers: ['auth', 'ad_account_id'],
  refreshOnSearch: true,
  options: async ({ auth, ad_account_id }, ctx) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    const search = ctx.searchValue?.trim() ?? '';

    try {
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const adAccountId = toAdAccountId(ad_account_id);
      const pins = await fetchPins({ accessToken, search, adAccountId });
      const options = toPinOptions(pins.items);

      return toDropdownState({
        options,
        truncated: pins.truncated,
        emptyPlaceholder:
          search.length > 0
            ? `No Pins match "${search}".`
            : 'No Pins found. Create one in Pinterest first.',
        truncatedPlaceholder:
          search.length > 0
            ? `Showing the first ${options.length} matches. Refine your search.`
            : `Showing the first ${options.length} Pins. Type to search.`,
      });
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading pins. Please try again.',
        options: [],
      };
    }
  },
});

async function fetchPins({
  accessToken,
  search,
  adAccountId,
}: {
  accessToken: string;
  search: string;
  adAccountId: string;
}): Promise<{ items: unknown[]; truncated: boolean }> {
  if (search.length === 0) {
    return fetchAllPages({
      accessToken,
      path:
        adAccountId.length > 0
          ? `/pins?ad_account_id=${encodeURIComponent(adAccountId)}`
          : '/pins',
    });
  }

  return fetchAllPages({
    accessToken,
    path: buildSearchPath({ resource: 'pins', search, adAccountId }),
    pageSize: null,
  });
}

function toDropdownState({
  options,
  truncated,
  emptyPlaceholder,
  truncatedPlaceholder,
}: {
  options: DropdownOption<string>[];
  truncated: boolean;
  emptyPlaceholder: string;
  truncatedPlaceholder: string;
}): DropdownState<string> {
  if (options.length === 0) {
    return {
      disabled: false,
      options: [],
      placeholder: emptyPlaceholder,
    };
  }

  if (truncated) {
    return {
      disabled: false,
      options,
      placeholder: truncatedPlaceholder,
    };
  }

  return {
    disabled: false,
    options,
  };
}

function toAdAccountId(value: unknown): string {
  return isNonEmptyString(value) ? value : '';
}

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

function buildSearchPath({
  resource,
  search,
  adAccountId,
}: {
  resource: 'boards' | 'pins';
  search: string;
  adAccountId: string;
}): string {
  const adAccountQuery =
    adAccountId.length > 0
      ? `&ad_account_id=${encodeURIComponent(adAccountId)}`
      : '';

  return `/search/${resource}?query=${encodeURIComponent(
    search
  )}${adAccountQuery}`;
}
