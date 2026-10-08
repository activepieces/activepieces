import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTimeEntry } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const searchDetailedReport = createAction({
  auth: togglTrackAuth,
  name: 'search_detailed_report',
  classification: 'SEARCH',
  displayName: 'Search Detailed Report',
  description:
    'Search all time entries of a workspace in a date range (detailed report).',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one page of all members\' time entries between two dates, with project, user, client, and description filters (the client filter is Classic only). Agents: use Time Summary (Agent) for totals. Returns { rows, next_cursor, has_more }; pass next_cursor back for the next page. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'First day of the report (YYYY-MM-DD).',
      required: true,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description:
        'Last day of the report (YYYY-MM-DD, inclusive). Leave empty for today.',
      required: false,
    }),
    project_ids: Property.ShortText({
      displayName: 'Project IDs',
      description: 'Comma-separated project IDs to include.',
      required: false,
    }),
    user_ids: Property.ShortText({
      displayName: 'User IDs',
      description: 'Comma-separated user IDs to include.',
      required: false,
    }),
    client_ids: Property.ShortText({
      displayName: 'Client IDs',
      description:
        'Comma-separated client IDs to include. Toggl Track (Classic) only.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description Contains',
      description: 'Only entries whose description contains this text.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Rows per page (default 50, max 100 on Toggl 2.0).',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Next Page Cursor',
      description:
        'Pass next_cursor from the last result; empty for the first page.',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.detailedReport,
  async run(context) {
    const { description, cursor } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const startDate = requireDate({
      value: context.propsValue.start_date,
      label: 'Start Date',
    });
    const endDate = context.propsValue.end_date
      ? requireDate({ value: context.propsValue.end_date, label: 'End Date' })
      : new Date().toISOString().slice(0, 10);
    if (endDate < startDate) {
      throw new Error('End Date must not be before Start Date.');
    }
    const projectIds = parseIdList({
      value: context.propsValue.project_ids,
      label: 'Project IDs',
    });
    const userIds = parseIdList({
      value: context.propsValue.user_ids,
      label: 'User IDs',
    });
    const clientIds = parseIdList({
      value: context.propsValue.client_ids,
      label: 'Client IDs',
    });
    const pageSize = Math.min(
      Math.max(Math.floor(context.propsValue.page_size ?? 50), 1),
      togglApi.isTwo(auth) ? 100 : 1000
    );

    if (togglApi.isTwo(auth)) {
      if (clientIds.length > 0) {
        throw togglApi.classicOnlyError('Filtering the report by client');
      }
      const page = cursor ? Number(cursor) : 1;
      if (!Number.isSafeInteger(page) || page < 1) {
        throw new Error('Next Page Cursor is not valid for Toggl 2.0.');
      }
      const queryParams: QueryParams = {
        date_from: new Date(`${startDate}T00:00:00Z`).toISOString(),
        date_to: new Date(`${endDate}T23:59:59Z`).toISOString(),
        include_taskless: 'true',
        page: String(page),
        per_page: String(pageSize),
        ...(projectIds.length === 1 ? { project_id: String(projectIds[0]) } : {}),
      };
      const response = await togglApi.request<{ data: TwoTimeEntry[] | null }>({
        auth,
        method: togglApi.HttpMethod.GET,
        path: togglApi.twoWorkspacePath({
          auth,
          workspaceId,
          path: '/time-entries',
        }),
        queryParams,
      });
      const entries = response?.data ?? [];
      const search = description?.trim().toLowerCase();
      const rows = entries
        .filter(togglModels.isTracked)
        .filter((entry) =>
          projectIds.length > 1
            ? !isNil(entry.project_id) && projectIds.includes(entry.project_id)
            : true
        )
        .filter((entry) =>
          userIds.length > 0 ? userIds.includes(entry.toggl_user_id) : true
        )
        .filter((entry) =>
          search
            ? (entry.description ?? '').toLowerCase().includes(search)
            : true
        )
        .map(togglModels.reportRow);
      const hasMore = entries.length === pageSize;
      return {
        rows,
        next_cursor: hasMore ? String(page + 1) : null,
        has_more: hasMore,
      };
    }

    const position = parseClassicCursor(cursor);
    const { body, headers } = await togglApi.classicReportsRequest<
      Record<string, unknown>[] | null
    >({
      auth,
      workspaceId,
      body: {
        start_date: startDate,
        end_date: endDate,
        page_size: pageSize,
        enrich_response: true,
        order_by: 'date',
        order_dir: 'ASC',
        ...(projectIds.length > 0 ? { project_ids: projectIds } : {}),
        ...(userIds.length > 0 ? { user_ids: userIds } : {}),
        ...(clientIds.length > 0 ? { client_ids: clientIds } : {}),
        ...(description ? { description } : {}),
        ...position,
      },
    });
    const nextCursor = classicNextCursor(headers);
    return {
      rows: body ?? [],
      next_cursor: nextCursor,
      has_more: !isNil(nextCursor),
    };
  },
});

function requireDate({
  value,
  label,
}: {
  value: string;
  label: string;
}): string {
  const trimmed = value.trim();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||
    Number.isNaN(new Date(`${trimmed}T00:00:00Z`).getTime())
  ) {
    throw new Error(`${label} must use the YYYY-MM-DD format.`);
  }
  return trimmed;
}

function parseIdList({
  value,
  label,
}: {
  value: string | undefined;
  label: string;
}): number[] {
  if (!value || value.trim() === '') {
    return [];
  }
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => togglApi.requireId({ value: part, label }));
}

function parseClassicCursor(
  cursor: string | undefined
): Record<string, number> {
  if (!cursor) {
    return {};
  }
  const id = Number(cursor.split(':')[0]);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Next Page Cursor is not valid for Toggl Track (Classic).');
  }
  return { first_id: id };
}

function classicNextCursor(headers: Record<string, unknown>): string | null {
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === 'x-next-id'
  );
  const value = Array.isArray(entry?.[1]) ? entry?.[1][0] : entry?.[1];
  return typeof value === 'string' && value !== '' ? value : null;
}
