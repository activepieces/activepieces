import type { AppConnectionType } from '@activepieces/pieces-framework';
import type { ConfigType } from 'dayjs';

export type SurrealdbAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: {
    url: string;
    database: string;
    namespace: string;
    username: string;
    password: string;
  };
};

export type SurrealdbStatementResult<T> = {
  time?: string;
  status?: string;
  result: T;
};

export type SurrealdbRow = Record<string, ConfigType>;

export type SurrealdbDbInfo = {
  tables: Record<string, string>;
};
