import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownState, Property, PropertyContext } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { YoutrackCapError, youtrackClient } from './client';

const MAX_DROPDOWN_ITEMS = 2000;
const SEARCH_PAGE_SIZE = 50;
const NOT_CONNECTED = 'Please connect your account first';

function flattenArray(value: unknown[]): unknown {
  if (value.length === 0) return null;
  if (youtrackClient.isRecord(value[0])) {
    return value
      .map((entry) => {
        if (youtrackClient.isRecord(entry) && typeof entry['name'] === 'string') {
          return entry['name'];
        }
        return JSON.stringify(entry);
      })
      .join(', ');
  }
  return value.join(', ');
}

function customFieldValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }
    return value
      .map((entry) => customFieldValue(entry))
      .filter((entry) => entry !== null)
      .join(', ');
  }
  if (youtrackClient.isRecord(value)) {
    for (const key of ['name', 'fullName', 'login', 'text', 'presentation']) {
      const candidate = value[key];
      if (typeof candidate === 'string' && candidate !== '') {
        return candidate;
      }
    }
    if (typeof value['minutes'] === 'number') {
      return value['minutes'];
    }
    return JSON.stringify(value);
  }
  return value;
}

async function allOptions({ auth, path, fields, operation, label, value }: AllOptionsParams): Promise<DropdownState<string>> {
  if (!auth) return { disabled: true, options: [], placeholder: NOT_CONNECTED };
  try {
    const rows = await youtrackClient.listAll({ auth, path, query: { fields }, maxItems: MAX_DROPDOWN_ITEMS, operation });
    const options = rows
      .map((row) => ({ label: label(row), value: value(row) }))
      .filter((option): option is { label: string; value: string } => option.value !== undefined);
    if (options.length === 0) {
      return { disabled: false, options: [], placeholder: 'Nothing found.' };
    }
    return { disabled: false, options };
  } catch (error) {
    if (error instanceof YoutrackCapError) {
      return {
        disabled: true,
        options: [],
        placeholder: `More than ${error.maxItems} entries: map the ID from a list action instead of picking it here.`,
      };
    }
    return dropdownError({ prefix: 'Failed to load options', error });
  }
}

async function loadProjectOptions({ auth }: { auth?: unknown }): Promise<DropdownState<string>> {
  return allOptions({
    auth,
    path: '/admin/projects',
    fields: 'id,name,shortName',
    operation: 'list projects',
    label: (p) => `${String(p['name'] ?? '')} (${String(p['shortName'] ?? '')})`,
    value: (p) => youtrackClient.optionalText(p['id']),
  });
}

async function loadIssueOptions({ auth, project, searchValue }: { auth?: unknown; project?: unknown; searchValue?: string }): Promise<DropdownState<string>> {
  if (!auth) return { disabled: true, options: [], placeholder: NOT_CONNECTED };
  try {
    const parts: string[] = [];
    const projectValue = youtrackClient.optionalText(project);
    if (projectValue !== undefined) {
      const resolved = await resolveProject({ auth, value: projectValue });
      parts.push('project: {' + resolved.shortName + '}');
    }
    const search = youtrackClient.optionalText(searchValue);
    if (search !== undefined) parts.push(search);
    const body = await youtrackClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/issues',
      query: { fields: 'id,idReadable,summary', query: parts.length > 0 ? parts.join(' ') : undefined, $top: SEARCH_PAGE_SIZE },
      operation: 'search issues',
    });
    const options = youtrackClient.records(body).flatMap((issue) => {
      const id = youtrackClient.optionalText(issue['id']);
      return id === undefined ? [] : [{ label: `${String(issue['idReadable'] ?? id)}: ${String(issue['summary'] ?? '')}`, value: id }];
    });
    if (options.length === 0) {
      return { disabled: false, options: [], placeholder: search !== undefined ? 'No issues match the search.' : 'No issues found.' };
    }
    return { disabled: false, options, placeholder: `Showing up to ${SEARCH_PAGE_SIZE} issues. Type an issue ID or words to search.` };
  } catch (error) {
    return dropdownError({ prefix: 'Failed to load issues', error });
  }
}

async function loadUserOptions({ auth, searchValue }: { auth?: unknown; searchValue?: string }): Promise<DropdownState<string>> {
  if (!auth) return { disabled: true, options: [], placeholder: NOT_CONNECTED };
  try {
    const search = youtrackClient.optionalText(searchValue);
    const body = await youtrackClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/users',
      query: { fields: 'id,name,login', query: search, $top: SEARCH_PAGE_SIZE },
      operation: 'search users',
    });
    const options = youtrackClient.records(body).flatMap((user) => {
      const id = youtrackClient.optionalText(user['id']);
      return id === undefined ? [] : [{ label: `${String(user['name'] ?? '')} (${String(user['login'] ?? '')})`, value: id }];
    });
    if (options.length === 0) {
      return { disabled: false, options: [], placeholder: 'No users found.' };
    }
    return { disabled: false, options, placeholder: `Showing up to ${SEARCH_PAGE_SIZE} users. Type a name or login to search.` };
  } catch (error) {
    return dropdownError({ prefix: 'Failed to load users', error });
  }
}

async function loadTagOptions({ auth }: { auth?: unknown }): Promise<DropdownState<string>> {
  return allOptions({
    auth,
    path: '/tags',
    fields: 'id,name',
    operation: 'list tags',
    label: (t) => String(t['name'] ?? ''),
    value: (t) => youtrackClient.optionalText(t['id']),
  });
}

async function loadBoardOptions({ auth }: { auth?: unknown }): Promise<DropdownState<string>> {
  return allOptions({
    auth,
    path: '/agiles',
    fields: 'id,name',
    operation: 'list agile boards',
    label: (b) => String(b['name'] ?? ''),
    value: (b) => youtrackClient.optionalText(b['id']),
  });
}

async function loadSprintOptions({ auth, board }: { auth?: unknown; board?: unknown }): Promise<DropdownState<string>> {
  if (!auth) return { disabled: true, options: [], placeholder: NOT_CONNECTED };
  if (youtrackClient.optionalText(board) === undefined) {
    return { disabled: true, options: [], placeholder: 'Select an agile board first' };
  }
  return allOptions({
    auth,
    path: `/agiles/${youtrackClient.segment({ value: board, label: 'Agile Board' })}/sprints`,
    fields: 'id,name,archived',
    operation: 'list sprints',
    label: (s) => `${String(s['name'] ?? '')}${s['archived'] === true ? ' (archived)' : ''}`,
    value: (s) => youtrackClient.optionalText(s['id']),
  });
}

async function loadCommentOptions({ auth, issue }: { auth?: unknown; issue?: unknown }): Promise<DropdownState<string>> {
  if (!auth) return { disabled: true, options: [], placeholder: NOT_CONNECTED };
  if (youtrackClient.optionalText(issue) === undefined) {
    return { disabled: true, options: [], placeholder: 'Select an issue first' };
  }
  return allOptions({
    auth,
    path: `/issues/${youtrackClient.segment({ value: issue, label: 'Issue' })}/comments`,
    fields: 'id,text,author(login)',
    operation: 'list comments',
    label: (c) => `${String(youtrackClient.recordOf(c['author'])['login'] ?? '')}: ${String(c['text'] ?? '').slice(0, 80)}`,
    value: (c) => youtrackClient.optionalText(c['id']),
  });
}

async function loadWorkItemOptions({ auth, issue }: { auth?: unknown; issue?: unknown }): Promise<DropdownState<string>> {
  if (!auth) return { disabled: true, options: [], placeholder: NOT_CONNECTED };
  if (youtrackClient.optionalText(issue) === undefined) {
    return { disabled: true, options: [], placeholder: 'Select an issue first' };
  }
  return allOptions({
    auth,
    path: `/issues/${youtrackClient.segment({ value: issue, label: 'Issue' })}/timeTracking/workItems`,
    fields: 'id,date,duration(presentation),author(login),text',
    operation: 'list work items',
    label: (w) => {
      const date = typeof w['date'] === 'number' ? new Date(w['date']).toISOString().slice(0, 10) : '';
      return `${date} ${String(youtrackClient.recordOf(w['duration'])['presentation'] ?? '')} ${String(youtrackClient.recordOf(w['author'])['login'] ?? '')} ${String(w['text'] ?? '').slice(0, 40)}`.trim();
    },
    value: (w) => youtrackClient.optionalText(w['id']),
  });
}

async function loadWorkItemTypeOptions({ auth }: { auth?: unknown }): Promise<DropdownState<string>> {
  return allOptions({
    auth,
    path: '/admin/timeTrackingSettings/workItemTypes',
    fields: 'id,name',
    operation: 'list work item types',
    label: (t) => String(t['name'] ?? ''),
    value: (t) => youtrackClient.optionalText(t['id']),
  });
}

async function loadGroupOptions({ auth }: { auth?: unknown }): Promise<DropdownState<string>> {
  return allOptions({
    auth,
    path: '/groups',
    fields: 'id,name',
    operation: 'list groups',
    label: (g) => String(g['name'] ?? ''),
    value: (g) => youtrackClient.optionalText(g['id']),
  });
}

async function loadArticleOptions({ auth, searchValue }: { auth?: unknown; searchValue?: string }): Promise<DropdownState<string>> {
  if (!auth) return { disabled: true, options: [], placeholder: NOT_CONNECTED };
  try {
    const body = await youtrackClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/articles',
      query: { fields: 'id,idReadable,summary', query: youtrackClient.optionalText(searchValue), $top: SEARCH_PAGE_SIZE },
      operation: 'search articles',
    });
    const options = youtrackClient.records(body).flatMap((article) => {
      const id = youtrackClient.optionalText(article['id']);
      return id === undefined ? [] : [{ label: `${String(article['idReadable'] ?? id)}: ${String(article['summary'] ?? '')}`, value: id }];
    });
    if (options.length === 0) {
      return { disabled: false, options: [], placeholder: 'No articles found.' };
    }
    return { disabled: false, options, placeholder: `Showing up to ${SEARCH_PAGE_SIZE} articles. Type to search.` };
  } catch (error) {
    return dropdownError({ prefix: 'Failed to load articles', error });
  }
}

function searchOf(ctx: PropertyContext | undefined): string | undefined {
  return ctx?.searchValue;
}

export function requireYoutrackAuth(auth: unknown): { baseUrl: string; apiToken: string } {
  const { baseUrl, token } = youtrackClient.connectionOf(auth);
  return { baseUrl, apiToken: token };
}

export async function getYoutrackUserTimeZoneId({ auth }: { auth: unknown }): Promise<string | null> {
  const body = await youtrackClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/users/me',
    query: { fields: 'profiles(general(timezone(id)))' },
    operation: 'read the time zone of the token user',
  });
  const profiles = youtrackClient.recordOf(youtrackClient.recordOf(body)['profiles']);
  const timezone = youtrackClient.recordOf(youtrackClient.recordOf(profiles['general'])['timezone']);
  return youtrackClient.optionalText(timezone['id']) ?? null;
}

export function formatYoutrackDateTimeLiteral({ epochMs, timeZoneId }: { epochMs: number; timeZoneId: string | null }): string {
  const date = new Date(epochMs);
  if (!timeZoneId) {
    return date.toISOString().slice(0, 19);
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneId,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`The YouTrack profile time zone "${timeZoneId}" of the token user is not a time zone this server knows (${reason}). Set a standard time zone (like Europe/Berlin) in the YouTrack profile.`);
  }
}

export function flattenObject({ obj, prefix = '' }: { obj: Record<string, unknown>; prefix?: string }): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '$type') continue;
    const flatKey = prefix ? prefix + '_' + key : key;
    if (value === null || value === undefined) {
      result[flatKey] = null;
    } else if (Array.isArray(value)) {
      result[flatKey] = flattenArray(value);
    } else if (youtrackClient.isRecord(value)) {
      Object.assign(result, flattenObject({ obj: value, prefix: flatKey }));
    } else {
      result[flatKey] = value;
    }
  }
  return result;
}

export function flattenIssue(issue: Record<string, unknown>): Record<string, unknown> {
  const { customFields, ...rest } = issue;
  const result = flattenObject({ obj: rest });
  const values: Record<string, unknown> = {};
  for (const field of youtrackClient.records(customFields)) {
    const name = field['name'];
    if (typeof name === 'string' && name !== '') {
      values[name] = customFieldValue(field['value']);
    }
  }
  result['customFields'] = values;
  return result;
}

export function dropdownError({ prefix, error }: { prefix: string; error: unknown }): DropdownState<string> {
  const message = error instanceof Error ? error.message : String(error);
  return { disabled: true, options: [], placeholder: prefix + ': ' + message };
}

export function yesNoFlag(value: unknown): boolean | undefined {
  if (value === 'yes' || value === true) return true;
  if (value === 'no' || value === false) return false;
  return undefined;
}

export function userSummary(value: unknown): { login: string | null; name: string | null; id: string | null } {
  const user = youtrackClient.recordOf(value);
  return {
    id: youtrackClient.textOrNull(user['id']),
    login: youtrackClient.textOrNull(user['login']),
    name: youtrackClient.textOrNull(user['name']) ?? youtrackClient.textOrNull(user['fullName']),
  };
}

export async function resolveProject({ auth, value }: { auth: unknown; value: unknown }): Promise<{ id: string; shortName: string; name: string | null }> {
  const text = youtrackClient.optionalText(value);
  if (text === undefined) {
    throw new Error('Project is required. Pick one, or map the ID or short name from List Projects.');
  }
  if (youtrackClient.isDatabaseId(text)) {
    const body = await youtrackClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/admin/projects/${youtrackClient.segment({ value: text, label: 'Project' })}`,
      query: { fields: 'id,shortName,name' },
      operation: 'read the project',
    });
    const project = youtrackClient.recordOf(body);
    return {
      id: youtrackClient.optionalText(project['id']) ?? text,
      shortName: youtrackClient.optionalText(project['shortName']) ?? text,
      name: youtrackClient.textOrNull(project['name']),
    };
  }
  const projects = await youtrackClient.listAll({
    auth,
    path: '/admin/projects',
    query: { fields: 'id,shortName,name' },
    maxItems: MAX_DROPDOWN_ITEMS,
    operation: 'list projects',
  });
  const lower = text.toLowerCase();
  const match =
    projects.find((p) => p['shortName'] === text) ??
    projects.find((p) => typeof p['shortName'] === 'string' && p['shortName'].toLowerCase() === lower) ??
    projects.find((p) => typeof p['name'] === 'string' && p['name'].toLowerCase() === lower);
  const id = youtrackClient.optionalText(match?.['id']);
  if (match === undefined || id === undefined) {
    throw new Error(`No YouTrack project matches "${text.slice(0, 80)}". Use the project ID (like 0-5), its short name (like APT) or its exact name; List Projects shows all three.`);
  }
  return {
    id,
    shortName: youtrackClient.optionalText(match['shortName']) ?? text,
    name: youtrackClient.textOrNull(match['name']),
  };
}

export async function resolveIssue({ auth, value }: { auth: unknown; value: unknown }): Promise<{ id: string; idReadable: string | null; summary: string | null }> {
  const body = await youtrackClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/issues/${youtrackClient.segment({ value, label: 'Issue' })}`,
    query: { fields: 'id,idReadable,summary' },
    operation: 'read the issue',
  });
  const issue = youtrackClient.recordOf(body);
  const id = youtrackClient.optionalText(issue['id']);
  if (id === undefined) {
    throw new Error('YouTrack did not return the issue ID.');
  }
  return { id, idReadable: youtrackClient.textOrNull(issue['idReadable']), summary: youtrackClient.textOrNull(issue['summary']) };
}

export function sprintRow(sprint: Record<string, unknown>): Record<string, unknown> {
  return {
    id: sprint['id'] ?? null,
    name: sprint['name'] ?? null,
    goal: sprint['goal'] ?? null,
    start: sprint['start'] ?? null,
    finish: sprint['finish'] ?? null,
    archived: sprint['archived'] ?? null,
    isDefault: sprint['isDefault'] ?? null,
    unresolvedIssuesCount: sprint['unresolvedIssuesCount'] ?? null,
  };
}

export function workItemRow(item: Record<string, unknown>): Record<string, unknown> {
  const duration = youtrackClient.recordOf(item['duration']);
  const type = youtrackClient.recordOf(item['type']);
  const author = userSummary(item['author']);
  const creator = userSummary(item['creator']);
  const issue = youtrackClient.recordOf(item['issue']);
  return {
    id: item['id'] ?? null,
    date: item['date'] ?? null,
    duration_minutes: youtrackClient.numberOrNull(duration['minutes']),
    duration_presentation: youtrackClient.textOrNull(duration['presentation']),
    text: item['text'] ?? null,
    type_id: youtrackClient.textOrNull(type['id']),
    type_name: youtrackClient.textOrNull(type['name']),
    author_login: author.login,
    author_name: author.name,
    creator_login: creator.login,
    issue_id: youtrackClient.textOrNull(issue['id']),
    issue_idReadable: youtrackClient.textOrNull(issue['idReadable']),
    issue_summary: youtrackClient.textOrNull(issue['summary']),
    created: item['created'] ?? null,
    updated: item['updated'] ?? null,
  };
}

export function articleRow(article: Record<string, unknown>): Record<string, unknown> {
  const project = youtrackClient.recordOf(article['project']);
  const parent = youtrackClient.recordOf(article['parentArticle']);
  const reporter = userSummary(article['reporter']);
  return {
    id: article['id'] ?? null,
    idReadable: article['idReadable'] ?? null,
    summary: article['summary'] ?? null,
    project_id: youtrackClient.textOrNull(project['id']),
    project_shortName: youtrackClient.textOrNull(project['shortName']),
    parent_id: youtrackClient.textOrNull(parent['id']),
    parent_idReadable: youtrackClient.textOrNull(parent['idReadable']),
    reporter_login: reporter.login,
    reporter_name: reporter.name,
    created: article['created'] ?? null,
    updated: article['updated'] ?? null,
    hasChildren: article['hasChildren'] ?? null,
  };
}

export function articleDetails(article: Record<string, unknown>): Record<string, unknown> {
  return {
    ...articleRow(article),
    content: article['content'] ?? null,
    child_articles: youtrackClient.records(article['childArticles']).map((child) => ({
      id: child['id'] ?? null,
      idReadable: child['idReadable'] ?? null,
      summary: child['summary'] ?? null,
    })),
    tags: youtrackClient.records(article['tags']).map((tag) => tag['name']).filter((name) => typeof name === 'string'),
  };
}

export function requiredProjectDropdown({ description }: { description: string }) {
  return Property.Dropdown({
    displayName: 'Project',
    description,
    required: true,
    auth: youtrackAuth,
    refreshers: [],
    options: async ({ auth }) => loadProjectOptions({ auth }),
  });
}

export function requiredIssueDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.Dropdown({
    displayName,
    description,
    required: true,
    auth: youtrackAuth,
    refreshers: ['project'],
    refreshOnSearch: true,
    options: async ({ auth, project }, ctx) => loadIssueOptions({ auth, project, searchValue: searchOf(ctx) }),
  });
}

export function yesNoDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string, false>({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

export const projectDropdown = requiredProjectDropdown({
  description: 'Select the YouTrack project to work with, or map the project ID (like 0-5) from List Projects.',
});

export const issueDropdown = requiredIssueDropdown({
  displayName: 'Issue',
  description: 'Select the issue to work with (type to search), or map an issue ID such as "2-38" or "APT-5" from Search Issues.',
});

export const tagDropdown = Property.Dropdown({
  displayName: 'Tag',
  description: 'Select a tag, or map the tag ID from List Tags.',
  required: true,
  refreshers: [],
  auth: youtrackAuth,
  options: async ({ auth }) => loadTagOptions({ auth }),
});

export const userDropdown = Property.Dropdown({
  displayName: 'User',
  description: 'Select a YouTrack user (type to search), or map the user ID from Find Users.',
  required: true,
  refreshers: [],
  refreshOnSearch: true,
  auth: youtrackAuth,
  options: async ({ auth }, ctx) => loadUserOptions({ auth, searchValue: searchOf(ctx) }),
});

export const groupDropdown = Property.Dropdown({
  auth: youtrackAuth,
  displayName: 'Visible to Group',
  description: 'Restrict comment visibility to a group, or map the group ID from List Groups. Leave empty for everyone.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    const state = await loadGroupOptions({ auth });
    if (state.disabled) return state;
    return { ...state, options: [{ label: '[Visible to everyone]', value: '' }, ...state.options] };
  },
});

export const boardDropdown = Property.Dropdown({
  displayName: 'Agile Board',
  description: 'Select the agile board, or map the board ID from List Agile Boards.',
  required: true,
  refreshers: [],
  auth: youtrackAuth,
  options: async ({ auth }) => loadBoardOptions({ auth }),
});

export const sprintDropdown = Property.Dropdown({
  displayName: 'Sprint',
  description: 'Select the sprint, or map the sprint ID from List Sprints.',
  required: true,
  refreshers: ['board'],
  auth: youtrackAuth,
  options: async ({ auth, board }) => loadSprintOptions({ auth, board }),
});

export const commentDropdown = Property.Dropdown({
  displayName: 'Comment',
  description: 'Select the comment, or map the comment ID from List Comments.',
  required: true,
  refreshers: ['issue'],
  auth: youtrackAuth,
  options: async ({ auth, issue }) => loadCommentOptions({ auth, issue }),
});

export const workItemDropdown = Property.Dropdown({
  displayName: 'Work Item',
  description: 'Select the work item, or map the work item ID from Find Work Items.',
  required: true,
  refreshers: ['issue'],
  auth: youtrackAuth,
  options: async ({ auth, issue }) => loadWorkItemOptions({ auth, issue }),
});

export const workItemTypeDropdown = Property.Dropdown({
  displayName: 'Work Type',
  description: 'Optional work type (like Development or Testing), or map a work item type ID from Get Project. Leave empty for none.',
  required: false,
  refreshers: [],
  auth: youtrackAuth,
  options: async ({ auth }) => loadWorkItemTypeOptions({ auth }),
});

export const articleDropdown = Property.Dropdown({
  displayName: 'Article',
  description: 'Select the Knowledge Base article (type to search), or map the article ID from Search Articles.',
  required: true,
  refreshers: [],
  refreshOnSearch: true,
  auth: youtrackAuth,
  options: async ({ auth }, ctx) => loadArticleOptions({ auth, searchValue: searchOf(ctx) }),
});

export const ISSUE_FIELDS =
  'id,idReadable,summary,description,created,updated,resolved,' +
  'project(id,name,shortName),' +
  'reporter(id,name,login),' +
  'commentsCount,votes,' +
  'tags(id,name),' +
  'customFields(id,name,' +
  'projectCustomField(field(id,name)),' +
  'value(id,name,login,fullName,text,minutes,presentation,isResolved))';

export const SPRINT_FIELDS = 'id,name,goal,start,finish,archived,isDefault,unresolvedIssuesCount';

export const WORK_ITEM_FIELDS =
  'id,date,duration(minutes,presentation),text,type(id,name),author(id,login,name),creator(id,login,name),issue(id,idReadable,summary),created,updated';

export const ARTICLE_FIELDS =
  'id,idReadable,summary,project(id,shortName,name),parentArticle(id,idReadable),reporter(id,login,name),created,updated,hasChildren';

export const ARTICLE_DETAIL_FIELDS = ARTICLE_FIELDS + ',content,childArticles(id,idReadable,summary),tags(id,name)';
export const LIST_LIMIT_MAX = 200;
export const LIST_LIMIT_DEFAULT = 50;

type AllOptionsParams = {
  auth?: unknown;
  path: string;
  fields: string;
  operation: string;
  label: (row: Record<string, unknown>) => string;
  value: (row: Record<string, unknown>) => string | undefined;
};
