export type PodioAuthValue = { access_token: string };

export type PodioUserStatus = {
  user?: { user_id?: number; mail?: string };
  profile?: { name?: string };
};

export type PodioOrg = { org_id: number; name: string };

export type PodioSpace = { space_id: number; name: string; org?: { name: string } };

export type PodioFieldOption = { id?: number; text?: string; name?: string; value?: string };

export type PodioAppField = {
  field_id: number;
  type: string;
  config: {
    label: string;
    description?: string;
    required?: boolean;
    settings?: { options?: PodioFieldOption[] };
  };
};

export type PodioApp = {
  app_id: number;
  name?: string;
  config?: { name?: string };
  space?: { name: string };
  fields?: PodioAppField[];
};

export type PodioItem = { item_id: number; title?: string };

export type PodioItemFilter = {
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_desc?: boolean;
  remember?: boolean;
};

export type PodioItemFilterResponse = { items?: PodioItem[]; filtered?: number; total?: number };

export type PodioTask = {
  task_id: number;
  text?: string;
  status?: string;
  due_date?: string;
  ref?: { title?: string };
};

export type PodioStatusData = { status_id: number; value?: string; text?: string };

export type PodioStreamObject = { type: string; data?: PodioStatusData };

export type PodioStream = { items?: PodioStreamObject[] };

export type PodioFile = {
  file_id: number;
  name?: string;
  size?: number;
  mimetype?: string;
  context?: { title?: string };
};

export type PodioHook = { hook_id: number };

export type PodioErrorBody = {
  error_description?: string;
  error?: string;
  message?: string;
  errors?: unknown;
};

export type PodioComment = {
  value: string;
  external_id?: string | null;
  files?: { file_id: number }[];
  embed?: { embed_id: number } | null;
};

export type PodioStatus = {
  value: string;
  files?: { file_id: number }[];
  embed?: { embed_id: number } | null;
};

export type PodioFormField = { field_id: number; settings?: unknown };

export type PodioForm = {
  settings?: Record<string, unknown> & { text?: Record<string, unknown> };
  domains?: unknown[];
  fields?: PodioFormField[];
  attachments?: boolean;
};

export type PodioShare = {
  abstract?: string | null;
  description?: string | null;
  language?: string | null;
  categories?: Record<string, { category_id: number }[]>;
};

export type PodioAppEmailConfiguration = { attachments: boolean; mappings: Record<string, string> };
