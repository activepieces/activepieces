import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { SummaryEntry, togglAgent } from '../common/agent';
import { togglApi } from '../common/client';
import { togglModels, TwoProject, TwoTimeEntry } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const timeSummaryAi = createAction({
  auth: togglTrackAuth,
  name: 'time_summary_ai',
  classification: 'SEARCH',
  displayName: 'Time Summary (Agent)',
  description: 'Sums tracked time in a date range, grouped by project, user, or client.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sums the tracked time of a workspace between two dates (YYYY-MM-DD, inclusive), grouped by "project" (default), "user", or "client". Agents: use this for totals instead of paging through Search Detailed Report or Find Time Entry. An optional project name or ID narrows the summary to that project. Returns { total_hours, total_seconds, groups: [{ name, id, hours, seconds, entry_count }] }. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'First day of the range (YYYY-MM-DD).',
      required: true,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Last day of the range (YYYY-MM-DD, inclusive). Leave empty for today.',
      required: false,
    }),
    group_by: Property.ShortText({
      displayName: 'Group By',
      description: '"project" (default), "user", or "client".',
      required: false,
    }),
    project: Property.ShortText({
      displayName: 'Project',
      description: 'Project name or ID. Leave empty for all projects.',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.timeSummary,
  async run(context) {
    const auth = context.auth;
    const startDate = requireDate({
      value: context.propsValue.start_date,
      label: 'Start Date',
    });
    const endDate = context.propsValue.end_date?.trim()
      ? requireDate({ value: context.propsValue.end_date, label: 'End Date' })
      : new Date().toISOString().slice(0, 10);
    if (endDate < startDate) {
      throw new Error('End Date must not be before Start Date.');
    }
    const groupBy = togglAgent.parseGroupBy(context.propsValue.group_by);
    const { workspaceId, projectId } = await togglAgent.resolveTarget({
      auth,
      projectReference: context.propsValue.project,
    });

    const entries = togglApi.isTwo(auth)
      ? await twoEntries({ auth, workspaceId, projectId, startDate, endDate, groupBy })
      : await classicEntries({ auth, workspaceId, projectId, startDate, endDate });

    const summary = togglAgent.summarize({ entries, groupBy });
    return {
      start_date: startDate,
      end_date: endDate,
      group_by: groupBy,
      ...summary,
    };
  },
});

async function classicEntries({
  auth,
  workspaceId,
  projectId,
  startDate,
  endDate,
}: {
  auth: Parameters<typeof togglApi.request>[0]['auth'];
  workspaceId: number;
  projectId: number | undefined;
  startDate: string;
  endDate: string;
}): Promise<SummaryEntry[]> {
  const entries: SummaryEntry[] = [];
  let firstId: number | undefined = undefined;
  for (let page = 0; page < MAX_REPORT_PAGES; page += 1) {
    const { body, headers } = await togglApi.classicReportsRequest<
      ClassicReportRow[] | null
    >({
      auth,
      workspaceId,
      body: {
        start_date: startDate,
        end_date: endDate,
        page_size: REPORT_PAGE_SIZE,
        enrich_response: true,
        order_by: 'date',
        order_dir: 'ASC',
        ...(projectId ? { project_ids: [projectId] } : {}),
        ...(firstId ? { first_id: firstId } : {}),
      },
    });
    for (const row of body ?? []) {
      for (const item of row.time_entries ?? []) {
        entries.push({
          seconds: item.seconds ?? null,
          projectId: row.project_id ?? null,
          projectName: row.project_name ?? null,
          userId: row.user_id ?? null,
          userName: row.username ?? null,
          clientId: null,
          clientName: row.client_name ?? null,
        });
      }
    }
    const next = headerValue({ headers, name: 'x-next-id' });
    if (!next) {
      return entries;
    }
    firstId = Number(next);
  }
  throw new Error(
    `The range has more than ${REPORT_PAGE_SIZE * MAX_REPORT_PAGES} report rows. Use a shorter date range.`
  );
}

async function twoEntries({
  auth,
  workspaceId,
  projectId,
  startDate,
  endDate,
  groupBy,
}: {
  auth: Parameters<typeof togglApi.request>[0]['auth'];
  workspaceId: number;
  projectId: number | undefined;
  startDate: string;
  endDate: string;
  groupBy: 'project' | 'user' | 'client';
}): Promise<SummaryEntry[]> {
  if (!togglApi.isTwo(auth)) {
    return [];
  }
  const [rawEntries, projects, users] = await Promise.all([
    togglApi.listTwoPages<TwoTimeEntry>({
      auth,
      path: togglApi.twoWorkspacePath({ auth, workspaceId, path: '/time-entries' }),
      queryParams: {
        date_from: new Date(`${startDate}T00:00:00Z`).toISOString(),
        date_to: new Date(`${endDate}T23:59:59Z`).toISOString(),
        include_taskless: 'true',
        ...(projectId ? { project_id: String(projectId) } : {}),
      },
    }),
    togglApi.listTwoPages<TwoProject>({
      auth,
      path: togglApi.twoWorkspacePath({ auth, workspaceId, path: '/projects' }),
    }),
    groupBy === 'user'
      ? togglApi.twoOrganizationUsers({ auth, perPage: 100 })
      : Promise.resolve([]),
  ]);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const userById = new Map(
    users.map((user) => [user.user_account_id, user.name])
  );
  return rawEntries.filter(togglModels.isTracked).map((entry) => {
    const project = isNil(entry.project_id)
      ? undefined
      : projectById.get(entry.project_id);
    return {
      seconds:
        isNil(entry.duration) || entry.duration < 0 ? null : entry.duration,
      projectId: entry.project_id ?? null,
      projectName: project?.name ?? null,
      userId: entry.toggl_user_id,
      userName: userById.get(entry.toggl_user_id) ?? null,
      clientId: project?.client?.id ?? null,
      clientName: project?.client?.name ?? null,
    };
  });
}

function requireDate({ value, label }: { value: string; label: string }): string {
  const trimmed = value.trim();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||
    Number.isNaN(new Date(`${trimmed}T00:00:00Z`).getTime())
  ) {
    throw new Error(`${label} must use the YYYY-MM-DD format.`);
  }
  return trimmed;
}

function headerValue({
  headers,
  name,
}: {
  headers: Record<string, unknown>;
  name: string;
}): string | null {
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === name
  );
  const value = Array.isArray(entry?.[1]) ? entry?.[1][0] : entry?.[1];
  return typeof value === 'string' && value !== '' ? value : null;
}

const REPORT_PAGE_SIZE = 1000;
const MAX_REPORT_PAGES = 20;

type ClassicReportRow = {
  user_id?: number | null;
  username?: string | null;
  project_id?: number | null;
  project_name?: string | null;
  client_name?: string | null;
  time_entries?: { seconds?: number | null }[] | null;
};
