import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackClient } from './client';
import { ISSUE_FIELDS } from './index';

const PAGE_SIZE = 50;
const MAX_NEW_ISSUES = 500;
const MAX_SCANNED_PAGES = 40;

async function fetchIssuePage({ auth, query, skip }: { auth: unknown; query: string; skip: number }): Promise<Record<string, unknown>[]> {
  const body = await youtrackClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/issues',
    query: { fields: ISSUE_FIELDS, query, $skip: skip, $top: PAGE_SIZE },
    operation: 'poll issues',
  });
  return youtrackClient.records(body);
}

async function collectNewIssues({ auth, query, after, epochOf, isEvent = () => true }: CollectParams): Promise<Record<string, unknown>[]> {
  const fresh: Record<string, unknown>[] = [];
  let eventCount = 0;
  for (let page = 0; page < MAX_SCANNED_PAGES; page++) {
    const batch = await fetchIssuePage({ auth, query, skip: page * PAGE_SIZE });
    for (const issue of batch) {
      if (epochOf(issue) <= after) continue;
      fresh.push(issue);
      if (isEvent(issue)) eventCount++;
    }
    if (batch.length < PAGE_SIZE) return fresh;
    if (eventCount >= MAX_NEW_ISSUES) break;
  }
  return withoutTrailingTies({ issues: fresh, epochOf });
}

function withoutTrailingTies({ issues, epochOf }: { issues: Record<string, unknown>[]; epochOf: EpochOf }): Record<string, unknown>[] {
  if (issues.length === 0) return issues;
  const last = epochOf(issues[issues.length - 1]);
  const kept = issues.filter((issue) => epochOf(issue) < last);
  return kept.length === 0 ? issues : kept;
}

function epochField({ issue, key }: { issue: Record<string, unknown>; key: string }): number {
  const value = issue[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export const issuePolling = {
  fetchIssuePage,
  collectNewIssues,
  epochField,
};

type EpochOf = (issue: Record<string, unknown>) => number;

type CollectParams = {
  auth: unknown;
  query: string;
  after: number;
  epochOf: EpochOf;
  isEvent?: (issue: Record<string, unknown>) => boolean;
};
