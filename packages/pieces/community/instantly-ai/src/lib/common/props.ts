import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';

export const listId = (required = true) =>
  Property.Dropdown({
    displayName: 'List',
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const options: DropdownOption<string>[] = [];

      let startingAfter: string | undefined = undefined;
      let hasMore = true;

      do {
        const qs: QueryParams = {
          limit: '100',
        };

        if (startingAfter) qs['starting_after'] = startingAfter;

        const response = (await makeRequest({
          endpoint: 'lead-lists',
          method: HttpMethod.GET,
          apiKey: auth as string,
          queryParams: qs,
        })) as {
          next_starting_after?: string;
          items: { id: string; name: string }[];
        };

        const items = response.items || [];
        for (const item of items) {
          options.push({ label: item.name, value: item.id });
        }

        startingAfter = response.next_starting_after;
        hasMore = !!startingAfter && items.length > 0;
      } while (hasMore);

      return {
        disabled: false,
        options,
      };
    },
  });

export const campaignId = (required = true) =>
  Property.Dropdown({
    displayName: 'Campaign',
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const options: DropdownOption<string>[] = [];

      let startingAfter: string | undefined = undefined;
      let hasMore = true;

      do {
        const qs: QueryParams = {
          limit: '100',
        };

        if (startingAfter) qs['starting_after'] = startingAfter;

        const response = (await makeRequest({
          endpoint: 'campaigns',
          method: HttpMethod.GET,
          apiKey: auth as string,
          queryParams: qs,
        })) as {
          next_starting_after?: string;
          items: { id: string; name: string }[];
        };

        const items = response.items || [];
        for (const item of items) {
          options.push({ label: item.name, value: item.id });
        }

        startingAfter = response.next_starting_after;
        hasMore = !!startingAfter && items.length > 0;
      } while (hasMore);

      return {
        disabled: false,
        options,
      };
    },
  });

export const leadId = (required = true) =>
  Property.Dropdown({
    displayName: 'Lead',
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const options: DropdownOption<string>[] = [];

      let startingAfter: string | undefined = undefined;
      let hasMore = true;

      do {
        const body:Record<string,any> = {
          limit: 100,
        };

        if (startingAfter) body['starting_after'] = startingAfter;

        const response = (await makeRequest({
          endpoint: 'leads/list',
          method: HttpMethod.POST,
          apiKey: auth as string,
          body
        })) as {
          next_starting_after?: string;
          items: { id: string; email: string ,first_name:string,last_name:string}[];
        };


        const items = response.items || [];
        for (const item of items) {
          options.push({ label: `${item.first_name} ${item.last_name}`, value: item.id });
        }

        startingAfter = response.next_starting_after;
        hasMore = !!startingAfter && items.length > 0;
      } while (hasMore);

      return {
        disabled: false,
        options,
      };
    },
  });

