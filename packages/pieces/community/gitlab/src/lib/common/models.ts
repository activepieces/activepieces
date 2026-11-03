export type ProjectWebhookRequest = {
  url: string;
  token?: string;
  issues_events?: boolean;
  confidential_issues_events?: boolean;
  push_events?: boolean;
  enable_ssl_verification?: boolean;
};

export type ProjectWebhook = {
  id: number;
  url: string;
};

export type GitlabProjectSummary = {
  id: number;
  name: string;
  name_with_namespace?: string;
  path_with_namespace: string;
};

export type GitlabIssue = {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  web_url: string;
};

export type GitlabNote = {
  id: number;
  body: string;
};

export type GitlabUserStatus = {
  emoji: string | null;
  message: string | null;
  availability: string | null;
  clear_status_at: string | null;
};

export type GitlabDiff = {
  diff?: string;
  [key: string]: unknown;
};
