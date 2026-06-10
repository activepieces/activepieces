export type RunnerAuth = {
  connectionType: string;
  host?: string;
  port?: number;
  serviceName?: string;
  connectionString?: string;
  user: string;
  password: string;
  thickMode?: boolean;
};

export type RunnerMode = 'thin' | 'thick';

type WithAuth<T> = T & { auth: RunnerAuth };

export type RunnerRequest =
  | { id: string; cmd: 'init'; thickMode: boolean }
  | WithAuth<{ id: string; cmd: 'validate' }>
  | WithAuth<{ id: string; cmd: 'getTables' }>
  | WithAuth<{ id: string; cmd: 'getColumns'; tableName: string }>
  | WithAuth<{
      id: string;
      cmd: 'insertRow';
      tableName: string;
      row: Record<string, unknown>;
    }>
  | WithAuth<{
      id: string;
      cmd: 'insertRows';
      tableName: string;
      rows: Record<string, unknown>[];
    }>
  | WithAuth<{
      id: string;
      cmd: 'updateRow';
      tableName: string;
      values: Record<string, unknown>;
      filter: Record<string, unknown>;
    }>
  | WithAuth<{
      id: string;
      cmd: 'deleteRow';
      tableName: string;
      filter: Record<string, unknown>;
    }>
  | WithAuth<{
      id: string;
      cmd: 'findRow';
      tableName: string;
      filter: Record<string, unknown>;
    }>
  | WithAuth<{
      id: string;
      cmd: 'execute';
      sql: string;
      binds: Record<string, unknown>;
    }>;

type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

export type RunnerRequestPayload = DistributiveOmit<RunnerRequest, 'id'>;

export type RunnerSuccess<T = unknown> = {
  id: string;
  ok: true;
  result: T;
  logs?: string[];
};

export type RunnerFailure = {
  id: string;
  ok: false;
  error: { message: string };
  logs?: string[];
};

export type RunnerResponse<T = unknown> = RunnerSuccess<T> | RunnerFailure;

export type ExecuteResult = {
  rows: unknown[];
  rowsAffected?: number;
};

export type AffectedResult = {
  success: boolean;
  rowsAffected: number;
};

export type DropdownEntry = { label: string; value: string };
