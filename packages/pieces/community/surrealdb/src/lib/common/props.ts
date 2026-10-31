import { DropdownState, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../auth';
import { surrealdbApi } from './api';
import type { SurrealdbDbInfo } from './types';

function table<R extends boolean>({ required, displayName = 'Table name', description }: PropParams<R>) {
  return Property.Dropdown({
    displayName,
    description,
    required,
    refreshers: ['auth'],
    refreshOnSearch: false,
    auth: surrealdbAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please authenticate first' });
      }
      try {
        const result = await surrealdbApi.query<SurrealdbDbInfo>({ auth, sql: 'INFO FOR DB' });
        const options = Object.keys(result[0].result.tables).map((row) => ({
          label: row,
          value: row,
        }));
        return {
          disabled: false,
          options,
        };
      } catch (e) {
        return disabledOptions({ placeholder: JSON.stringify(e) });
      }
    },
  });
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const surrealdbProps = { table };

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
