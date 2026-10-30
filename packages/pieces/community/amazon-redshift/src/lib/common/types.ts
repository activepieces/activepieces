import type { AppConnectionType } from '@activepieces/pieces-framework';

export type RedshiftPasswordProps = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  enable_ssl: boolean;
};

export type RedshiftIamProps = {
  roleArn: string;
  region: string;
  database: string;
  workgroupName: string | undefined;
  clusterIdentifier: string | undefined;
  dbUser: string | undefined;
  secretArn: string | undefined;
};

export type RedshiftAuthValue =
  | { type: AppConnectionType.CUSTOM_AUTH; props: RedshiftPasswordProps }
  | { type: AppConnectionType.OIDC; props: RedshiftIamProps };

export type RedshiftTable = {
  table_schema: string;
  table_name: string;
};

export type RedshiftColumn = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

export type RedshiftRow = Record<string, unknown>;

export type RedshiftQueryResult = {
  rows: RedshiftRow[];
  rowCount: number;
};
