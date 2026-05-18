export interface ListProjectsRequest {
  membership?: boolean;
  simple?: boolean;
}
export interface ProjectWebhookRequest {
  url: string;
  confidential_issues_events?: boolean;
  confidential_note_events?: boolean;
  deployment_events?: boolean;
  enable_ssl_verification?: boolean;
  issues_events?: boolean;
  job_events?: boolean;
  merge_requests_events?: boolean;
  note_events?: boolean;
  pipeline_events?: boolean;
  push_events_branch_filter?: string;
  push_events?: boolean;
  releases_events?: boolean;
  tag_push_events?: boolean;
  wiki_page_events?: boolean;
  token?: boolean;
}
export interface CreateProjectIssueRequest {
  title: string;
  description?: string;
}
export interface ProjectWebhook {
  id: string;
}
export interface GitlabProject {
  id: string;
  description?: string;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  created_at: string;
  default_branch: string;
  tag_list?: string[];
  topics?: string[];
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  web_url: string;
  avatar_url?: string;
  star_count: number;
  last_activity_at: string;
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: string;
    full_path: string;
    parent_id?: string;
    avatar_url?: string;
    web_url: string;
  };
}
