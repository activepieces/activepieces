import { isNil } from '@activepieces/pieces-framework';
import { TogglAuthValue, togglApi } from './client';
import { TwoProject } from './models';

async function listCandidateProjects({
  auth,
  includeArchived,
}: {
  auth: TogglAuthValue;
  includeArchived: boolean;
}): Promise<AgentProject[]> {
  if (togglApi.isTwo(auth)) {
    const workspaces = await togglApi.twoWorkspaces(auth);
    const perWorkspace = await Promise.all(
      workspaces.map(async (workspace) => {
        const projects = await togglApi.listTwoPages<TwoProject>({
          auth,
          path: togglApi.twoWorkspacePath({
            auth,
            workspaceId: workspace.id,
            path: '/projects',
          }),
          queryParams: includeArchived ? {} : { archived: 'false' },
        });
        return projects.map((project) => ({
          id: project.id,
          name: project.name,
          workspaceId: workspace.id,
          clientName: project.client?.name ?? null,
        }));
      })
    );
    return perWorkspace.flat();
  }
  const projects = await togglApi.request<ClassicProject[] | null>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: '/me/projects',
    ...(includeArchived ? { queryParams: { include_archived: 'true' } } : {}),
  });
  return (projects ?? []).map((project) => ({
    id: project.id,
    name: project.name,
    workspaceId: project.workspace_id,
    clientName: project.client_name ?? null,
  }));
}

function pickProject({
  projects,
  reference,
}: {
  projects: AgentProject[];
  reference: string;
}): AgentProject {
  const trimmed = reference.trim();
  if (/^\d+$/.test(trimmed)) {
    const byId = projects.find((project) => String(project.id) === trimmed);
    if (byId) {
      return byId;
    }
  }
  const lowered = trimmed.toLowerCase();
  const byName = projects.filter(
    (project) => project.name.trim().toLowerCase() === lowered
  );
  if (byName.length === 1) {
    return byName[0];
  }
  if (byName.length > 1) {
    const ids = byName.map((project) => project.id).join(', ');
    throw new Error(
      `${byName.length} projects are named "${trimmed}" (IDs: ${ids}). Pass the project ID instead.`
    );
  }
  const names = projects
    .slice(0, MAX_LISTED_PROJECTS)
    .map((project) => `${project.name} (${project.id})`)
    .join(', ');
  throw new Error(
    `Project "${trimmed}" was not found. Projects: ${names || 'none'}${
      projects.length > MAX_LISTED_PROJECTS ? ', …' : ''
    }.`
  );
}

async function defaultWorkspaceId(auth: TogglAuthValue): Promise<number> {
  if (togglApi.isTwo(auth)) {
    const settings = await togglApi.twoSettings(auth);
    return settings.current_workspace_id;
  }
  const me = await togglApi.request<{ default_workspace_id?: number } | null>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: '/me',
  });
  if (isNil(me?.default_workspace_id)) {
    throw new Error('Could not determine the default Toggl workspace.');
  }
  return me.default_workspace_id;
}

async function resolveTarget({
  auth,
  projectReference,
  includeArchived = false,
}: {
  auth: TogglAuthValue;
  projectReference: string | undefined;
  includeArchived?: boolean;
}): Promise<{ workspaceId: number; projectId: number | undefined }> {
  const reference = projectReference?.trim();
  if (!reference) {
    return {
      workspaceId: await defaultWorkspaceId(auth),
      projectId: undefined,
    };
  }
  const projects = await listCandidateProjects({ auth, includeArchived });
  const project = pickProject({ projects, reference });
  return { workspaceId: project.workspaceId, projectId: project.id };
}

function parseStart({ value }: { value: string }): string {
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === 'now' || trimmed === '') {
    return new Date().toISOString();
  }
  return togglApi.toIsoDateTime({ value: trimmed, label: 'Start' });
}

function durationSeconds({ minutes }: { minutes: unknown }): number {
  const parsed = typeof minutes === 'string' ? Number(minutes) : minutes;
  if (
    typeof parsed !== 'number' ||
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    throw new Error('Duration must be a positive number of minutes.');
  }
  const seconds = Math.round(parsed * 60);
  if (seconds <= 0) {
    throw new Error('Duration must be a positive number of minutes.');
  }
  return seconds;
}

function summarize({
  entries,
  groupBy,
}: {
  entries: SummaryEntry[];
  groupBy: SummaryGroupBy;
}): TimeSummary {
  const groups = new Map<string, TimeSummaryGroup>();
  let totalSeconds = 0;
  for (const entry of entries) {
    const seconds = entry.seconds;
    if (isNil(seconds) || seconds < 0) {
      continue;
    }
    totalSeconds += seconds;
    const target =
      groupBy === 'project'
        ? { id: entry.projectId, name: entry.projectName }
        : groupBy === 'user'
        ? { id: entry.userId, name: entry.userName }
        : { id: entry.clientId, name: entry.clientName };
    const key = `${target.id ?? ''}|${target.name ?? ''}`;
    const group = groups.get(key) ?? {
      id: target.id ?? null,
      name: target.name ?? fallbackName(groupBy),
      seconds: 0,
      hours: 0,
      entry_count: 0,
    };
    group.seconds += seconds;
    group.entry_count += 1;
    groups.set(key, group);
  }
  const list = [...groups.values()]
    .map((group) => ({ ...group, hours: toHours(group.seconds) }))
    .sort((a, b) => b.seconds - a.seconds);
  return {
    total_seconds: totalSeconds,
    total_hours: toHours(totalSeconds),
    groups: list,
  };
}

function parseGroupBy(value: string | undefined): SummaryGroupBy {
  const trimmed = (value ?? '').trim().toLowerCase();
  if (trimmed === '') {
    return 'project';
  }
  if (trimmed === 'project' || trimmed === 'user' || trimmed === 'client') {
    return trimmed;
  }
  throw new Error('Group By must be "project", "user", or "client".');
}

function fallbackName(groupBy: SummaryGroupBy): string {
  return groupBy === 'project'
    ? 'No project'
    : groupBy === 'client'
    ? 'No client'
    : 'Unknown user';
}

function toHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
}

const MAX_LISTED_PROJECTS = 25;

export const togglAgent = {
  listCandidateProjects,
  pickProject,
  defaultWorkspaceId,
  resolveTarget,
  parseStart,
  durationSeconds,
  parseGroupBy,
  summarize,
  toHours,
};

export type AgentProject = {
  id: number;
  name: string;
  workspaceId: number;
  clientName: string | null;
};

export type SummaryGroupBy = 'project' | 'user' | 'client';

export type SummaryEntry = {
  seconds: number | null;
  projectId: number | null;
  projectName: string | null;
  userId: number | null;
  userName: string | null;
  clientId: number | null;
  clientName: string | null;
};

export type TimeSummaryGroup = {
  id: number | null;
  name: string;
  seconds: number;
  hours: number;
  entry_count: number;
};

export type TimeSummary = {
  total_seconds: number;
  total_hours: number;
  groups: TimeSummaryGroup[];
};

type ClassicProject = {
  id: number;
  name: string;
  workspace_id: number;
  client_name?: string | null;
};
