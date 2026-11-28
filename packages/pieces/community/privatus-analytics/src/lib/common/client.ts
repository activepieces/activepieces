import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const PRIVATUS_BASE_URL = 'https://privatusanalytics.com';

export class PrivatusApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'PrivatusApiError';
  }
}

/**
 * Sends a GET request to the Privatus Analytics API and returns the `data`
 * field of the response.
 */
export async function privatusApiCall<T>({
  token,
  path,
  queryParams,
}: {
  token: string;
  path: string;
  queryParams?: Record<string, string | number | boolean | undefined>;
}): Promise<T> {
  const params: QueryParams = {};
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (value !== undefined && value !== '') {
      params[key] = String(value);
    }
  }
  try {
    const response = await httpClient.sendRequest<{ data: T }>({
      method: HttpMethod.GET,
      url: `${PRIVATUS_BASE_URL}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      headers: { Accept: 'application/json' },
      queryParams: params,
      timeout: 30000,
    });
    return response.body.data;
  } catch (error) {
    if (error instanceof HttpError) {
      const body = error.response.body as
        | { error?: { message?: string } }
        | undefined;
      const message = body?.error?.message ?? 'The request failed.';
      throw new PrivatusApiError(
        error.response.status,
        `Privatus Analytics returned ${error.response.status}: ${message}`
      );
    }
    throw error;
  }
}

export function segment(value: string): string {
  return encodeURIComponent(value);
}

export async function getWorkspaceId(token: string): Promise<string> {
  const workspaces = await privatusApiCall<{ id: string }[]>({
    token,
    path: '/workspaces.json',
  });
  if (!workspaces || workspaces.length === 0) {
    throw new Error('This API token cannot see any workspace.');
  }
  return workspaces[0].id;
}

export type PrivatusSite = {
  id: string;
  domain: string;
  name: string | null;
  timezone: string | null;
  currency?: string | null;
  favorite?: boolean;
  created_at?: string;
};

export async function listSites(
  token: string,
  query?: string
): Promise<PrivatusSite[]> {
  const workspaceId = await getWorkspaceId(token);
  const sites: PrivatusSite[] = [];
  for (let page = 1; page <= 20; page++) {
    const batch = await privatusApiCall<PrivatusSite[]>({
      token,
      path: `/workspaces/${segment(workspaceId)}/sites.json`,
      queryParams: { page, per_page: 100, query },
    });
    sites.push(...batch);
    if (batch.length < 100) {
      break;
    }
  }
  return sites;
}

export type PrivatusGoal = {
  id: string;
  name: string;
  kind: string;
  pattern: string | null;
  event_name: string | null;
  archived: boolean;
  stats: {
    completions: number;
    conversions: number;
    conversion_rate: number;
    value: number;
    change: number | null;
  };
};

export type GoalsResult = {
  goals: PrivatusGoal[];
};

export async function listGoals(
  token: string,
  siteId: string,
  periodParams: Record<string, string | undefined>
): Promise<PrivatusGoal[]> {
  const goals: PrivatusGoal[] = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await privatusApiCall<PrivatusGoal[]>({
      token,
      path: `/sites/${segment(siteId)}/goals.json`,
      queryParams: { ...periodParams, page, per_page: 100 },
    });
    goals.push(...batch);
    if (batch.length < 100) {
      break;
    }
  }
  return goals;
}

export type PeriodInfo = { from: string; to: string };

/** The day the period starts, as YYYY-MM-DD. */
export function periodStartDate(period: PeriodInfo | undefined): string {
  return period?.from?.slice(0, 10) ?? '';
}

/** The last day of the period, as YYYY-MM-DD (the API end is exclusive). */
export function periodEndDate(period: PeriodInfo | undefined): string {
  if (!period?.to) {
    return '';
  }
  const end = period.to;
  if (/T00:00:00/.test(end)) {
    const day = new Date(`${end.slice(0, 10)}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 1);
    return day.toISOString().slice(0, 10);
  }
  return end.slice(0, 10);
}

export function goalToRow(goal: PrivatusGoal) {
  return {
    goal_id: goal.id,
    goal_name: goal.name,
    goal_kind: goal.kind,
    goal_pattern: goal.pattern ?? goal.event_name ?? null,
    completions: goal.stats?.completions ?? 0,
    conversions: goal.stats?.conversions ?? 0,
    conversion_rate_percent: goal.stats?.conversion_rate ?? 0,
    value_cents: goal.stats?.value ?? 0,
    change_percent: goal.stats?.change ?? null,
  };
}
