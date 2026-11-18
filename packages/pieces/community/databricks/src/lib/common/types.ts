import type { AppConnectionType } from '@activepieces/pieces-framework';

export type DatabricksCredentials = {
  workspaceUrl: string;
  clientId: string;
  clientSecret: string;
};

export type DatabricksAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  access_token?: string;
  props: DatabricksCredentials;
};

export type DatabricksToken = { access_token: string; expires_in?: number };

export type DatabricksWarehouse = { id: string; name: string; state?: string };

export type DatabricksNamed = { name: string; full_name?: string };

export type DatabricksColumn = {
  name: string;
  type_name?: string;
  type_text?: string;
  nullable?: boolean;
  comment?: string;
};

export type DatabricksTable = DatabricksNamed & {
  columns?: DatabricksColumn[];
};

export type DatabricksGenieSpace = {
  space_id: string;
  title: string;
  description?: string;
};

export type DatabricksFileColumn = { name: string; type_name?: string };

export type DatabricksStatementParameter = { name: string; value?: string };

export type DatabricksStatement = {
  statement_id: string;
  status: { state: string; error?: { error_code?: string; message?: string } };
  manifest?: {
    schema?: { columns?: { name: string; type_name?: string }[] };
    total_row_count?: number;
    truncated?: boolean;
  };
  result?: DatabricksResultChunk;
};

export type DatabricksResultChunk = {
  data_array?: (string | null)[][];
  next_chunk_index?: number;
};

export type DatabricksQueryResult = {
  statementId: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
};

export type DatabricksGenieAttachment = {
  attachment_id?: string;
  text?: { content?: string };
  query?: { query?: string; description?: string; title?: string };
};

export type DatabricksGenieMessage = {
  id?: string;
  message_id?: string;
  conversation_id: string;
  status: string;
  attachments?: DatabricksGenieAttachment[];
  error?: { error?: string; type?: string };
};

export type DatabricksPage<K extends string, T> = { [P in K]?: T[] } & {
  next_page_token?: string;
};

export type DatabricksTableLocation = {
  catalogName: string;
  schemaName: string;
  tableName: string;
};

export type DatabricksRowSource = {
  sql: string;
  columnNames: string[];
  parameters: DatabricksStatementParameter[];
};

export type DatabricksGenieAnswer = {
  conversationId: string;
  messageId: string;
  status: string;
  answer: string;
  sql: string | null;
  queryDescription: string | null;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
};
