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
  kind?: string;
  details?: { kind?: string };
  result: T;
};

export type SurrealdbRpcResponse<T> = {
  id?: number;
  result?: T;
  error?: { code?: number; kind?: string; message?: string };
};

export type SurrealdbRow = Record<string, ConfigType>;

export type SurrealdbDbInfo = {
  tables: Record<string, string>;
};

export type SurrealdbWhere = {
  clause: string;
  vars: Record<string, unknown>;
};

export type SurrealdbDbStructure = {
  tables?: Record<string, unknown>[];
};

export type SurrealdbRootStructure = {
  namespaces?: Record<string, unknown>[];
};

export type SurrealdbNamespaceStructure = {
  databases?: Record<string, unknown>[];
};

export type SurrealdbGraphqlResponse = {
  data?: Record<string, unknown> | null;
  errors?: { message?: string }[];
};
