import { isNil } from '@activepieces/pieces-framework';
import { TwoOrganizationUser } from './client';

function client(item: TwoClient): NormalizedClient {
  return {
    id: item.id,
    wid: item.workspace_id,
    name: item.name,
    archived: !item.active,
    at: item.updated_at ?? item.created_at,
    creator_id: item.toggl_user_id ?? null,
    notes: null,
    external_reference: null,
  };
}

function tag(item: TwoTag): NormalizedTag {
  return {
    id: item.id,
    workspace_id: item.workspace_id,
    name: item.name,
    at: item.updated_at ?? item.created_at,
    creator_id: null,
    deleted_at: item.deleted_at ?? null,
  };
}

function project(item: TwoProject): NormalizedProject {
  const estimatedMinutes = item.estimated_mins ?? null;
  const trackedSeconds = item.total_tracked_secs ?? null;
  return {
    id: item.id,
    workspace_id: item.workspace_id,
    client_id: item.client_id ?? null,
    client_name: item.client?.name ?? null,
    name: item.name,
    is_private: item.private,
    active: isNil(item.archived_at),
    status: isNil(item.archived_at) ? 'active' : 'archived',
    billable: item.billable,
    template: item.is_template,
    color: item.color ?? null,
    auto_estimates: item.auto_compute_estimates,
    estimated_hours: isNil(estimatedMinutes) ? null : estimatedMinutes / 60,
    estimated_seconds: isNil(estimatedMinutes) ? null : estimatedMinutes * 60,
    actual_seconds: trackedSeconds,
    actual_hours: isNil(trackedSeconds) ? null : trackedSeconds / 3600,
    rate: null,
    currency: item.fixed_fee?.currency ?? null,
    fixed_fee: item.fixed_fee?.amount ?? null,
    start_date: item.start_date ?? null,
    end_date: item.end_date ?? null,
    pinned: item.pinned,
    created_at: item.created_at,
    at: item.updated_at ?? item.created_at,
  };
}

function task(item: TwoTask): NormalizedTask {
  const estimatedMinutes = item.estimated_mins ?? null;
  return {
    id: item.id,
    name: item.name,
    workspace_id: item.workspace_id,
    project_id: item.project_id ?? null,
    project_name: item.project?.name ?? null,
    client_name: item.client?.name ?? null,
    user_id: item.toggl_user_id ?? null,
    active: isNil(item.archived_at),
    estimated_seconds: isNil(estimatedMinutes) ? null : estimatedMinutes * 60,
    tracked_seconds: item.total_tracked_time ?? null,
    recurring: item.is_recurring_series ?? false,
    external_reference: null,
    at: item.updated_at ?? item.created_at,
  };
}

function timeEntry({
  item,
  running,
}: {
  item: TwoTimeEntry;
  running: boolean;
}): NormalizedTimeEntry {
  const start = item.start ?? null;
  const startMs = isNil(start) ? null : new Date(start).getTime();
  const isRunning = running || (isNil(item.duration) && !isNil(start));
  const duration = isRunning ? -1 : item.duration ?? null;
  const stop =
    !isRunning && !isNil(startMs) && !isNil(item.duration)
      ? new Date(startMs + item.duration * 1000).toISOString()
      : null;
  return {
    id: item.id,
    workspace_id: item.workspace_id,
    project_id: item.project_id ?? null,
    task_id: item.task_id ?? null,
    user_id: item.toggl_user_id,
    description: item.description ?? null,
    start,
    stop,
    duration,
    billable: item.billable ?? false,
    tags: (item.tags ?? []).map((entryTag) => entryTag.name),
    tag_ids: item.tag_ids ?? (item.tags ?? []).map((entryTag) => entryTag.id),
    at: item.updated_at ?? item.created_at,
  };
}

function user({
  item,
  workspaceId,
}: {
  item: TwoOrganizationUser;
  workspaceId: number;
}): NormalizedUser {
  const membership = item.workspaces.find(
    (workspace) => workspace.id === workspaceId
  );
  return {
    id: membership?.workspace_user_id ?? item.id,
    user_id: item.user_account_id,
    workspace_id: workspaceId,
    name: item.name,
    email: item.email,
    active: item.active,
    inactive: !item.active,
    admin: null,
    role: null,
    timezone: null,
    at: item.updated_at ?? item.created_at ?? null,
  };
}

function reportRow(item: TwoTimeEntry): NormalizedReportRow {
  const entry = timeEntry({ item, running: false });
  return {
    user_id: entry.user_id,
    username: null,
    project_id: entry.project_id,
    project_name: null,
    client_name: null,
    task_id: entry.task_id,
    task_name: null,
    description: entry.description,
    billable: entry.billable,
    tag_ids: entry.tag_ids,
    tag_names: entry.tags,
    row_number: null,
    time_entries: [
      {
        id: entry.id,
        seconds: isNil(entry.duration) || entry.duration < 0 ? null : entry.duration,
        start: entry.start,
        stop: entry.stop,
        at: entry.at,
      },
    ],
  };
}

function classicWorkspace(
  workspace: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(workspace).filter(
      ([key]) => key !== 'api_token' && key !== 'ical_url'
    )
  );
}

function twoWorkspace({
  id,
  name,
  organizationId,
  currency,
}: {
  id: number;
  name: string | null;
  organizationId: number;
  currency: string | null;
}): Record<string, unknown> {
  return {
    id,
    name,
    organization_id: organizationId,
    role: null,
    admin: null,
    premium: null,
    default_currency: currency,
    default_hourly_rate: null,
    active_project_count: null,
    logo_url: null,
    last_modified: null,
    at: null,
  };
}

function isTracked(item: TwoTimeEntry): boolean {
  return !isNil(item.start);
}

function isTimeEntry(value: unknown): value is TwoTimeEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number'
  );
}

export const togglModels = {
  client,
  tag,
  project,
  task,
  timeEntry,
  user,
  reportRow,
  classicWorkspace,
  twoWorkspace,
  isTracked,
  isTimeEntry,
};

type Lite = { id: number; name: string };

export type TwoClient = {
  id: number;
  workspace_id: number;
  name: string;
  active: boolean;
  toggl_user_id?: number;
  created_at: string;
  updated_at?: string;
};

export type TwoTag = {
  id: number;
  workspace_id: number;
  name: string;
  color?: string | null;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type TwoProject = {
  id: number;
  workspace_id: number;
  name: string;
  private: boolean;
  billable: boolean;
  is_template: boolean;
  auto_compute_estimates: boolean;
  pinned: boolean;
  client_id?: number | null;
  client?: Lite | null;
  color?: string | null;
  estimated_mins?: number | null;
  total_tracked_secs?: number | null;
  fixed_fee?: { amount: number; currency: string } | null;
  start_date?: string | null;
  end_date?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at?: string;
};

export type TwoTask = {
  id: number;
  workspace_id: number;
  name: string;
  project_id?: number | null;
  project?: Lite | null;
  client?: Lite | null;
  toggl_user_id?: number;
  estimated_mins?: number | null;
  total_tracked_time?: number | null;
  is_recurring_series?: boolean;
  archived_at?: string | null;
  created_at: string;
  updated_at?: string;
};

export type TwoTimeEntry = {
  id: number;
  workspace_id: number;
  toggl_user_id: number;
  project_id?: number | null;
  task_id?: number | null;
  description?: string | null;
  start?: string | null;
  planned_start?: string | null;
  duration?: number | null;
  billable?: boolean;
  tags?: Lite[] | null;
  tag_ids?: number[] | null;
  created_at: string;
  updated_at?: string;
};

export type NormalizedClient = {
  id: number;
  wid: number;
  name: string;
  archived: boolean;
  at: string;
  creator_id: number | null;
  notes: string | null;
  external_reference: string | null;
};

export type NormalizedTag = {
  id: number;
  workspace_id: number;
  name: string;
  at: string;
  creator_id: number | null;
  deleted_at: string | null;
};

export type NormalizedProject = {
  id: number;
  workspace_id: number;
  client_id: number | null;
  client_name: string | null;
  name: string;
  is_private: boolean;
  active: boolean;
  status: string;
  billable: boolean;
  template: boolean;
  color: string | null;
  auto_estimates: boolean;
  estimated_hours: number | null;
  estimated_seconds: number | null;
  actual_seconds: number | null;
  actual_hours: number | null;
  rate: number | null;
  currency: string | null;
  fixed_fee: number | null;
  start_date: string | null;
  end_date: string | null;
  pinned: boolean;
  created_at: string;
  at: string;
};

export type NormalizedTask = {
  id: number;
  name: string;
  workspace_id: number;
  project_id: number | null;
  project_name: string | null;
  client_name: string | null;
  user_id: number | null;
  active: boolean;
  estimated_seconds: number | null;
  tracked_seconds: number | null;
  recurring: boolean;
  external_reference: string | null;
  at: string;
};

export type NormalizedTimeEntry = {
  id: number;
  workspace_id: number;
  project_id: number | null;
  task_id: number | null;
  user_id: number;
  description: string | null;
  start: string | null;
  stop: string | null;
  duration: number | null;
  billable: boolean;
  tags: string[];
  tag_ids: number[];
  at: string;
};

export type NormalizedUser = {
  id: number;
  user_id: number;
  workspace_id: number;
  name: string;
  email: string;
  active: boolean;
  inactive: boolean;
  admin: boolean | null;
  role: string | null;
  timezone: string | null;
  at: string | null;
};

export type NormalizedReportRow = {
  user_id: number;
  username: string | null;
  project_id: number | null;
  project_name: string | null;
  client_name: string | null;
  task_id: number | null;
  task_name: string | null;
  description: string | null;
  billable: boolean;
  tag_ids: number[];
  tag_names: string[];
  row_number: number | null;
  time_entries: {
    id: number;
    seconds: number | null;
    start: string | null;
    stop: string | null;
    at: string;
  }[];
};
