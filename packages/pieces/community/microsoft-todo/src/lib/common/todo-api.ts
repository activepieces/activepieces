import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import {
  ChecklistItem,
  DateTimeTimeZone,
  Importance,
  LinkedResource,
  TaskStatus,
  TaskFileAttachment,
  TodoTask,
  TodoTaskList,
} from '@microsoft/microsoft-graph-types';

async function listPage<T>({
  client,
  path,
  top,
  filter,
  pageToken,
}: {
  client: Client;
  path: string;
  top: number | undefined;
  filter?: string;
  pageToken?: string;
}): Promise<{ items: T[]; nextPageToken: string | null }> {
  const token = pageToken?.trim();
  if (token) {
    assertPageTokenMatches({ token, path, filter });
    const page: PageCollection = await client.api(token).get();
    return { items: page.value, nextPageToken: page['@odata.nextLink'] ?? null };
  }
  let call = client.api(path).top(clampTop(top));
  if (filter) {
    call = call.filter(filter);
  }
  const page: PageCollection = await call.get();
  return { items: page.value, nextPageToken: page['@odata.nextLink'] ?? null };
}

function assertPageTokenMatches({ token, path, filter }: { token: string; path: string; filter?: string }): void {
  const url = parseUrl(token);
  const tokenPath = url ? decodeURIComponent(url.pathname) : '';
  const tokenFilter = url?.searchParams.get('$filter') ?? '';
  const matches =
    url !== null &&
    tokenPath.endsWith(decodeURIComponent(path)) &&
    tokenFilter.trim() === (filter ?? '').trim();
  if (!matches) {
    throw new Error(
      'This page token belongs to a different list or filter. Pass the nextPageToken from the previous call with the same inputs, or leave Page Token empty to start over.',
    );
  }
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

async function listAll<T>({ client, path }: { client: Client; path: string }): Promise<T[]> {
  const items: T[] = [];
  let response: PageCollection = await client.api(path).get();
  while (response.value.length > 0) {
    items.push(...response.value);
    if (!response['@odata.nextLink']) {
      break;
    }
    response = await client.api(response['@odata.nextLink']).get();
  }
  return items;
}

function listPath({ listId }: { listId: string }): string {
  return `/me/todo/lists/${encodeURIComponent(listId.trim())}`;
}

function taskPath({ listId, taskId }: { listId: string; taskId: string }): string {
  return `${listPath({ listId })}/tasks/${encodeURIComponent(taskId.trim())}`;
}

function checklistItemPath({
  listId,
  taskId,
  checklistItemId,
}: {
  listId: string;
  taskId: string;
  checklistItemId: string;
}): string {
  return `${taskPath({ listId, taskId })}/checklistItems/${encodeURIComponent(checklistItemId.trim())}`;
}

function linkedResourcePath({
  listId,
  taskId,
  linkedResourceId,
}: {
  listId: string;
  taskId: string;
  linkedResourceId: string;
}): string {
  return `${taskPath({ listId, taskId })}/linkedResources/${encodeURIComponent(linkedResourceId.trim())}`;
}

function attachmentPath({
  listId,
  taskId,
  attachmentId,
}: {
  listId: string;
  taskId: string;
  attachmentId: string;
}): string {
  return `${taskPath({ listId, taskId })}/attachments/${encodeURIComponent(attachmentId.trim())}`;
}

function matchFilter({ field, value, matchType }: { field: string; value: string; matchType?: string }): string {
  const escaped = value.replace(/'/g, "''");
  switch (matchType) {
    case 'exact':
      return `${field} eq '${escaped}'`;
    case 'startsWith':
      return `startsWith(${field}, '${escaped}')`;
    default:
      return `contains(${field}, '${escaped}')`;
  }
}

function toDateTimeTimeZone(value: string | undefined): DateTimeTimeZone | undefined {
  return value ? { dateTime: value, timeZone: 'UTC' } : undefined;
}

function toTaskList(list: TodoTaskList) {
  return {
    id: list.id ?? null,
    displayName: list.displayName ?? null,
    isOwner: list.isOwner ?? null,
    isShared: list.isShared ?? null,
    wellknownListName: list.wellknownListName ?? null,
  };
}

function toTask(task: TodoTask) {
  return {
    id: task.id ?? null,
    title: task.title ?? null,
    status: task.status ?? null,
    importance: task.importance ?? null,
    body: task.body?.content ?? null,
    bodyContentType: task.body?.contentType ?? null,
    categories: task.categories ?? [],
    dueDateTime: task.dueDateTime?.dateTime ?? null,
    dueTimeZone: task.dueDateTime?.timeZone ?? null,
    startDateTime: task.startDateTime?.dateTime ?? null,
    startTimeZone: task.startDateTime?.timeZone ?? null,
    reminderDateTime: task.reminderDateTime?.dateTime ?? null,
    reminderTimeZone: task.reminderDateTime?.timeZone ?? null,
    isReminderOn: task.isReminderOn ?? null,
    completedDateTime: task.completedDateTime?.dateTime ?? null,
    hasAttachments: task.hasAttachments ?? null,
    recurrence: task.recurrence ?? null,
    createdDateTime: task.createdDateTime ?? null,
    lastModifiedDateTime: task.lastModifiedDateTime ?? null,
    bodyLastModifiedDateTime: task.bodyLastModifiedDateTime ?? null,
  };
}

function toChecklistItem(item: ChecklistItem) {
  return {
    id: item.id ?? null,
    displayName: item.displayName ?? null,
    isChecked: item.isChecked ?? null,
    checkedDateTime: item.checkedDateTime ?? null,
    createdDateTime: item.createdDateTime ?? null,
  };
}

function toLinkedResource(resource: LinkedResource) {
  return {
    id: resource.id ?? null,
    displayName: resource.displayName ?? null,
    applicationName: resource.applicationName ?? null,
    webUrl: resource.webUrl ?? null,
    externalId: resource.externalId ?? null,
  };
}

function toAttachment(attachment: TaskFileAttachment) {
  return {
    id: attachment.id ?? null,
    name: attachment.name ?? null,
    contentType: attachment.contentType ?? null,
    size: attachment.size ?? null,
    lastModifiedDateTime: attachment.lastModifiedDateTime ?? null,
  };
}

function toImportance(value: string): Importance {
  return IMPORTANCE_VALUES.find((v) => v === value) ?? 'normal';
}

function toStatus(value: string): TaskStatus {
  return STATUS_VALUES.find((v) => v === value) ?? 'notStarted';
}

function clampTop(value: number | undefined): number {
  if (value === undefined || value === null) {
    return 50;
  }
  return Math.min(Math.max(Math.trunc(value), 1), 100);
}

const IMPORTANCE_VALUES: Importance[] = ['low', 'normal', 'high'];
const STATUS_VALUES: TaskStatus[] = ['notStarted', 'inProgress', 'completed', 'waitingOnOthers', 'deferred'];

export const todoApi = {
  listPage,
  listAll,
  listPath,
  taskPath,
  checklistItemPath,
  linkedResourcePath,
  attachmentPath,
  matchFilter,
  toDateTimeTimeZone,
  toImportance,
  toStatus,
  toTaskList,
  toTask,
  toChecklistItem,
  toLinkedResource,
  toAttachment,
};

export const TASK_STATUS_OPTIONS = [
  { label: 'Not Started', value: 'notStarted' },
  { label: 'In Progress', value: 'inProgress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Waiting On Others', value: 'waitingOnOthers' },
  { label: 'Deferred', value: 'deferred' },
];

export const IMPORTANCE_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
];

export const MATCH_TYPE_OPTIONS = [
  { label: 'Contains', value: 'contains' },
  { label: 'Starts With', value: 'startsWith' },
  { label: 'Exact Match', value: 'exact' },
];
