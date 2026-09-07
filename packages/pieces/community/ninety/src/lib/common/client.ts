import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';

async function sendRequest<T>({
  token,
  method,
  path,
  body,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
}): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${NINETY_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: token.trim(),
    },
    ...(isNil(body) ? {} : { body }),
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error) {
    throw describeError(error);
  }
}

function describeError(error: unknown): unknown {
  if (!(error instanceof HttpError)) {
    return error;
  }
  const hint = NINETY_STATUS_HINTS[error.response.status];
  if (isNil(hint)) {
    return error;
  }
  const detail = error.response.body;
  return new Error(
    `${hint} (Ninety returned ${error.response.status}: ${JSON.stringify(detail)})`
  );
}

function itemsFrom<T>(body: NinetyQueryResponse<T> | null | undefined): T[] {
  if (isNil(body)) {
    return [];
  }
  if (Array.isArray(body)) {
    return body;
  }
  return body.items ?? [];
}

function totalFrom<T>({
  body,
  fallback,
}: {
  body: NinetyQueryResponse<T> | null | undefined;
  fallback: number;
}): number {
  if (isNil(body) || Array.isArray(body)) {
    return fallback;
  }
  return body.totalCount ?? fallback;
}

function toDateOnly({ value, field }: { value: string; field: string }): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return toIsoDate({ value: trimmed, field }).slice(0, 10);
}

function toIsoDate({ value, field }: { value: string; field: string }): string {
  const parsed = new Date(value.trim());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} is not a valid date: "${value}"`);
  }
  return parsed.toISOString();
}

function toOptionalDateOnly({
  value,
  field,
}: {
  value: string | undefined;
  field: string;
}): string | undefined {
  return isNil(value) ? undefined : toDateOnly({ value, field });
}

function toOptionalIsoDate({
  value,
  field,
}: {
  value: string | undefined;
  field: string;
}): string | undefined {
  return isNil(value) ? undefined : toIsoDate({ value, field });
}

function userLabel(user: NinetyUser): string {
  const parts = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter((part) => !isNil(part) && part.length > 0);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  const email = user.primaryEmail?.trim();
  if (!isNil(email) && email.length > 0) {
    return email;
  }
  return user.id;
}

export const ninetyCommon = {
  toDateOnly,
  toIsoDate,
  toOptionalDateOnly,
  toOptionalIsoDate,
  userLabel,

  async listTeams({ token }: { token: string }): Promise<NinetyTeam[]> {
    const body = await sendRequest<NinetyQueryResponse<NinetyTeam>>({
      token,
      method: HttpMethod.GET,
      path: '/teams',
    });
    return itemsFrom(body);
  },

  async listUsers({
    token,
    teamId,
  }: {
    token: string;
    teamId?: string;
  }): Promise<NinetyUser[]> {
    const trimmedTeamId = teamId?.trim();
    const path =
      isNil(trimmedTeamId) || trimmedTeamId.length === 0
        ? '/users'
        : `/users/team/${encodeURIComponent(trimmedTeamId)}`;
    const body = await sendRequest<NinetyQueryResponse<NinetyUser>>({
      token,
      method: HttpMethod.GET,
      path,
    });
    return itemsFrom(body);
  },

  async createTodo({
    token,
    todo,
  }: {
    token: string;
    todo: NinetyTodoInput;
  }): Promise<NinetyTodo> {
    return await sendRequest<NinetyTodo>({
      token,
      method: HttpMethod.POST,
      path: '/todos',
      body: todo,
    });
  },

  async updateTodo({
    token,
    todoId,
    todo,
  }: {
    token: string;
    todoId: string;
    todo: NinetyTodoInput;
  }): Promise<NinetyTodo> {
    return await sendRequest<NinetyTodo>({
      token,
      method: HttpMethod.PATCH,
      path: `/todos/${encodeURIComponent(todoId)}`,
      body: todo,
    });
  },

  async queryTodos({
    token,
    query,
  }: {
    token: string;
    query: NinetyTodoQuery;
  }): Promise<NinetyPageResult<NinetyTodo>> {
    const body = await sendRequest<NinetyQueryResponse<NinetyTodo>>({
      token,
      method: HttpMethod.POST,
      path: '/todos/query',
      body: query,
    });
    const items = itemsFrom(body);
    return { items, totalCount: totalFrom({ body, fallback: items.length }) };
  },

  async createIssue({
    token,
    issue,
  }: {
    token: string;
    issue: NinetyIssueInput;
  }): Promise<NinetyIssue> {
    return await sendRequest<NinetyIssue>({
      token,
      method: HttpMethod.POST,
      path: '/issues',
      body: issue,
    });
  },

  async updateIssue({
    token,
    issueId,
    issue,
  }: {
    token: string;
    issueId: string;
    issue: NinetyIssueInput;
  }): Promise<NinetyIssue> {
    return await sendRequest<NinetyIssue>({
      token,
      method: HttpMethod.PATCH,
      path: `/issues/${encodeURIComponent(issueId)}`,
      body: issue,
    });
  },

  async queryIssues({
    token,
    query,
  }: {
    token: string;
    query: NinetyIssueQuery;
  }): Promise<NinetyPageResult<NinetyIssue>> {
    const body = await sendRequest<NinetyQueryResponse<NinetyIssue>>({
      token,
      method: HttpMethod.POST,
      path: '/issues/query',
      body: query,
    });
    const items = itemsFrom(body);
    return { items, totalCount: totalFrom({ body, fallback: items.length }) };
  },

  async createRock({
    token,
    rock,
    addCreatorToFollowersList,
  }: {
    token: string;
    rock: NinetyRockInput;
    addCreatorToFollowersList?: boolean;
  }): Promise<NinetyRock> {
    return await sendRequest<NinetyRock>({
      token,
      method: HttpMethod.POST,
      path: '/rocks',
      body: {
        rock,
        ...(isNil(addCreatorToFollowersList)
          ? {}
          : { addCreatorToFollowersList }),
      },
    });
  },

  async updateRock({
    token,
    rockId,
    rock,
  }: {
    token: string;
    rockId: string;
    rock: NinetyRockPatch;
  }): Promise<NinetyRock> {
    return await sendRequest<NinetyRock>({
      token,
      method: HttpMethod.PATCH,
      path: `/rocks/${encodeURIComponent(rockId)}`,
      body: rock,
    });
  },

  async queryRocks({
    token,
    query,
  }: {
    token: string;
    query: NinetyRockQuery;
  }): Promise<NinetyPageResult<NinetyRock>> {
    const body = await sendRequest<NinetyQueryResponse<NinetyRock>>({
      token,
      method: HttpMethod.POST,
      path: '/rocks/query/paged',
      body: query,
    });
    const items = itemsFrom(body);
    return { items, totalCount: totalFrom({ body, fallback: items.length }) };
  },

  async createMilestone({
    token,
    milestone,
  }: {
    token: string;
    milestone: NinetyMilestoneInput;
  }): Promise<NinetyMilestone> {
    return await sendRequest<NinetyMilestone>({
      token,
      method: HttpMethod.POST,
      path: '/milestones',
      body: milestone,
    });
  },

  async queryMeasurables({
    token,
    query,
  }: {
    token: string;
    query: NinetyMeasurableQuery;
  }): Promise<NinetyPageResult<NinetyMeasurable>> {
    const body = await sendRequest<NinetyQueryResponse<NinetyMeasurable>>({
      token,
      method: HttpMethod.POST,
      path: '/scorecard/kpis/query',
      body: query,
    });
    const items = itemsFrom(body);
    return { items, totalCount: totalFrom({ body, fallback: items.length }) };
  },

  async setMeasurableScore({
    token,
    measurableId,
    value,
    periodStartDate,
  }: {
    token: string;
    measurableId: string;
    value: number;
    periodStartDate: string;
  }): Promise<unknown> {
    return await sendRequest<unknown>({
      token,
      method: HttpMethod.POST,
      path: `/scorecard/kpis/${encodeURIComponent(measurableId)}/scores`,
      body: { value, periodStartDate },
    });
  },

  async validateAuth({ token }: { token: string }): Promise<void> {
    await sendRequest<unknown>({
      token,
      method: HttpMethod.GET,
      path: '/teams',
    });
  },
};

export const NINETY_BASE_URL = 'https://api.public.ninety.io/v1';

export const NINETY_STATUS_HINTS: Record<number, string | undefined> = {
  401: 'Ninety rejected this access token. Generate a new one under Settings > Developer Settings.',
  403: 'This Ninety account cannot reach the public API. It is available on the Thrive plan, and a token only ever sees what its owner can see.',
  429: 'Ninety rate limit reached: 25 requests per second per user. Space the requests out and try again.',
};

export type NinetyQueryResponse<T> = T[] | { items?: T[]; totalCount?: number };

export type NinetyPageResult<T> = {
  items: T[];
  totalCount: number;
};

export type NinetyTeam = {
  _id: string;
  name: string;
};

export type NinetyUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  primaryEmail?: string;
};

export type NinetyTodo = {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  isPersonal: boolean;
  completed: boolean;
  archived: boolean;
  teamId?: string;
  teamName?: string;
  userId: string;
  companyId: string;
  createdDate: string;
};

export type NinetyTodoInput = {
  title?: string;
  description?: string;
  dueDate?: string;
  teamId?: string;
  repeat?: string;
  userId?: string;
  completed?: boolean;
  archived?: boolean;
};

export type NinetyTodoQuery = {
  teamId?: string;
  sort?: string;
  order?: string;
  page?: number;
  pageSize?: number;
  isPersonal?: boolean;
  completed?: boolean;
  archived?: boolean;
  searchText?: string;
  title?: string;
  userIds?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
};

export type NinetyIssue = {
  _id: string;
  title?: string;
  description?: string;
  teamId?: string;
  userId?: string;
  companyId?: string;
  intervalCode?: string;
  priority?: number;
  completed?: boolean;
  archived?: boolean;
  createdDate?: string;
};

export type NinetyIssueInput = {
  title?: string;
  teamId?: string;
  interval?: string;
  description?: string;
  priority?: number;
  userId?: string;
  completed?: boolean;
};

export type NinetyIssueQuery = {
  sortField?: string;
  sortDirection?: string;
  pageIndex?: number;
  pageSize?: number;
  teamId?: string;
  intervalCode?: string;
  searchText?: string;
};

export type NinetyRock = {
  _id: string;
  title: string;
  description?: string;
  teamId: string;
  userId: string;
  companyId: string;
  statusCode: string;
  levelCode: string;
  quarter: string;
  dueDate: string;
  futureScope?: string;
  archived: boolean;
  completed: boolean;
  createdDate?: string;
  updatedAt?: string;
  additionalTeamIds?: string[];
};

export type NinetyRockInput = {
  teamId: string;
  title: string;
  dueDate: string;
  statusCode: string;
  levelCode: string;
  quarter: string;
  description?: string;
  additionalTeamIds?: string[];
  futureScope?: string;
};

export type NinetyRockPatch = {
  title?: string;
  description?: string;
  teamId?: string;
  userId?: string;
  statusCode?: string;
  levelCode?: string;
  quarter?: string;
  dueDate?: string;
  futureScope?: string;
  archived?: boolean;
  additionalTeamIds?: string[];
};

export type NinetyRockQuery = {
  sortField?: string;
  sortDirection?: string;
  pageIndex?: number;
  pageSize?: number;
  teamId?: string;
  userId?: string;
  statusCode?: string;
  levelCode?: string;
  futureScope?: string;
  archived?: boolean;
  searchText?: string;
};

export type NinetyMilestone = {
  _id: string;
  rockId: string;
  teamId: string;
  ownedByUserId?: string;
  title: string;
  description?: string;
  dueDate: string;
  isDone: boolean;
  isDeleted?: boolean;
  completedDate?: string;
  createdDate?: string;
};

export type NinetyMilestoneInput = {
  rockId: string;
  teamId: string;
  title: string;
  dueDate: string;
  description?: string;
};

export type NinetyMeasurable = {
  _id: string;
  title: string;
  unit: string;
  currency?: string;
  periodInterval: string;
  userFullName?: string;
  type?: string;
  isSmart?: boolean;
};

export type NinetyMeasurableQuery = {
  pageIndex?: number;
  pageSize?: number;
  periodInterval?: string;
  searchText?: string;
  searchTitle?: string;
  searchOwner?: string;
  teamId?: string;
  sortField?: string;
  sortDirection?: string;
  unassignedOnly?: boolean;
  userIds?: string[];
};
