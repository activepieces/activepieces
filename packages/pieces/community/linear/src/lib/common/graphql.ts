import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from './client';
import { LinearIssueNode } from './mappers';
import { GET_ISSUE_QUERY, ISSUE_ID_LOOKUP_QUERY, ISSUE_REMOVE_LABEL_MUTATION } from './queries';

async function request<T>({ auth, query, variables }: RequestParams): Promise<T> {
  try {
    const result = await makeClient(auth).typedRequest<T>(query, variables);
    if (result.data === undefined || result.data === null) {
      throw new Error('Linear returned an empty response.');
    }
    return result.data;
  } catch (error) {
    throw toActionError(error);
  }
}

function toActionError(error: unknown): Error {
  if (!isLinearError(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const detail = (firstGraphqlMessage(error) ?? error.message).trim().replace(/\.+$/, '');
  const notFound = NOT_FOUND_PATTERN.exec(detail);
  if (notFound) {
    return new Error(`No Linear ${describeEntity(notFound[1])} found with that ID. Check the ID and that this API key can see it.`);
  }
  switch (error.type) {
    case 'AuthenticationError':
      return new Error(
        'Linear did not accept the API key of this connection. Create a new personal API key in Linear (Settings, Security & access) and update the connection.',
      );
    case 'Forbidden':
      if (PLAN_LIMIT_PATTERN.test(detail)) {
        return new Error(`Linear refused this request: ${detail}.`);
      }
      return new Error(
        `Linear refused this request: ${detail}. The API key may be missing the Write or Admin permission, or may not have access to this team.`,
      );
    case 'Ratelimited':
      return new Error('Linear rate limit reached. Wait a minute and try again.');
    case 'InvalidInput':
      return new Error(`Linear rejected the input: ${detail}.`);
    case 'FeatureNotAccessible':
      return new Error(`This Linear feature is not available on the workspace plan: ${detail}`);
    default:
      return new Error(`Linear API error: ${detail}`);
  }
}

function isNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.startsWith('No Linear ') || NOT_FOUND_PATTERN.test(error.message);
}

function describeEntity(typeName: string): string {
  if (typeName === 'ProjectUpdate') return 'project status update';
  return typeName.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

async function removeIssueLabel({ auth, id, labelId }: { auth: LinearAuth; id: string; labelId: string }): Promise<LinearIssueNode> {
  try {
    const data = await request<{ issueRemoveLabel: { success: boolean; issue: LinearIssueNode | null } }>({
      auth,
      query: ISSUE_REMOVE_LABEL_MUTATION,
      variables: { id, labelId },
    });
    const payload = requireSuccess({ payload: data.issueRemoveLabel, what: 'label change' });
    if (!payload.issue) {
      throw new Error('Linear did not return the updated issue.');
    }
    return payload.issue;
  } catch (error) {
    if (!(error instanceof Error) || !LABEL_NOT_ON_ISSUE_PATTERN.test(error.message)) {
      throw error;
    }
    const current = await request<{ issue: LinearIssueNode | null }>({ auth, query: GET_ISSUE_QUERY, variables: { id } });
    if (!current.issue) {
      throw error;
    }
    return current.issue;
  }
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isIssueIdentifier(value: string): boolean {
  return ISSUE_IDENTIFIER_PATTERN.test(value);
}

async function resolveIssueId({ auth, value }: { auth: LinearAuth; value: unknown }): Promise<string> {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length === 0) {
    throw new Error('An issue ID or identifier (for example ENG-123) is required.');
  }
  if (isUuid(trimmed)) {
    return trimmed;
  }
  if (!isIssueIdentifier(trimmed)) {
    throw new Error(`"${trimmed}" is not an issue UUID or an identifier like ENG-123.`);
  }
  const data = await request<{ issue: { id: string } | null }>({
    auth,
    query: ISSUE_ID_LOOKUP_QUERY,
    variables: { id: trimmed.toUpperCase() },
  }).catch((error: unknown) => {
    if (isNotFoundError(error)) {
      throw new Error(`No Linear issue found for ${trimmed}.`);
    }
    throw error;
  });
  if (!data.issue?.id) {
    throw new Error(`No Linear issue found for ${trimmed}.`);
  }
  return data.issue.id;
}

function toTimelessDate({ value, fieldName }: { value: unknown; fieldName: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a date in YYYY-MM-DD format.`);
  }
  const match = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(value.trim());
  if (!match || Number.isNaN(Date.parse(match[1]))) {
    throw new Error(`${fieldName} must be a date in YYYY-MM-DD format, got "${value}".`);
  }
  return match[1];
}

function definedOnly(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    }),
  );
}

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const items = (Array.isArray(value) ? value : [value])
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : undefined;
}

function toOptionalNumber({ value, fieldName }: { value: unknown; fieldName: string }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a number.`);
  }
  return parsed;
}

function toOptionalInteger({ value, fieldName }: { value: unknown; fieldName: string }): number | undefined {
  const parsed = toOptionalNumber({ value, fieldName });
  if (parsed !== undefined && !Number.isInteger(parsed)) {
    throw new Error(`${fieldName} must be a whole number.`);
  }
  return parsed;
}

function clampLimit({ value, fallback, max }: { value: unknown; fallback: number; max: number }): number {
  const parsed = toOptionalNumber({ value, fieldName: 'Limit' });
  if (parsed === undefined) return fallback;
  if (parsed < 1) return 1;
  return Math.min(Math.floor(parsed), max);
}

function requireSuccess<T extends { success: boolean }>({ payload, what }: { payload: T | null | undefined; what: string }): T {
  if (!payload || payload.success !== true) {
    throw new Error(`Linear did not confirm the ${what}.`);
  }
  return payload;
}

function isLinearError(error: unknown): error is LinearErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    ('type' in error || 'errors' in error)
  );
}

function firstGraphqlMessage(error: LinearErrorLike): string | undefined {
  return error.errors?.find((e) => typeof e.message === 'string' && e.message.length > 0)?.message;
}

const NOT_FOUND_PATTERN = /Could not find referenced (\w+)/i;
const PLAN_LIMIT_PATTERN = /\b(plan|upgrade)\b/i;
const LABEL_NOT_ON_ISSUE_PATTERN = /is not on issue/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISSUE_IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9_]*-\d+$/;

export const linearGraphql = {
  request,
  toActionError,
  resolveIssueId,
  isUuid,
  isIssueIdentifier,
  toTimelessDate,
  definedOnly,
  toStringArray,
  toOptionalNumber,
  toOptionalInteger,
  clampLimit,
  requireSuccess,
  removeIssueLabel,
  isNotFoundError,
};

export type LinearAuth = AppConnectionValueForAuthProperty<typeof linearAuth>;

type RequestParams = {
  auth: LinearAuth;
  query: string;
  variables?: Record<string, unknown>;
};

type LinearErrorLike = {
  type?: string;
  message: string;
  errors?: Array<{ message?: string }>;
};
