import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';

export async function teamhoodApiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: TeamhoodAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
}): Promise<HttpResponse<T>> {
  const baseUrl = auth.baseUrl.replace(/\/+$/, '');
  const response= await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}/api/v1${path}`,
    headers: {
      'X-ApiKey': auth.apiKey,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
  return response;
}

export type TeamhoodAuth = {
  baseUrl: string;
  apiKey: string;
};

export type TeamhoodWorkspace = {
  id: string;
  displayId: string;
  title: string;
};

export type TeamhoodBoard = {
  id: string;
  displayId: string;
  title: string;
  isPrivate: boolean | null;
};

export type TeamhoodRow = {
  id: string;
  title: string;
  index: number;
};

export type TeamhoodStatus = {
  id: string;
  title: string;
  type: 'New' | 'InProgress' | 'Completed';
  index: number;
};

export type TeamhoodUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'Active' | 'Disabled' | 'Invited';
  lastActivityDate: string | null;
  accessibleWorkspaces: string[];
};

export type TeamhoodItem = {
  id: string;
  displayId: string;
  workspaceId: string;
  boardId: string | null;
  rowId: string;
  title: string | null;
  statusId: string | null;
  ownerId: string | null;
  assignedUserId: string | null;
  color: number;
  startDate: string | null;
  dueDate: string | null;
  isScheduleLocked: boolean;
  completedOn: string | null;
  description: string | null;
  budget: number | null;
  estimation: number | null;
  estimationType: string | null;
  completed: boolean;
  archived: boolean;
  modifiedDate: string;
  createdDate: string;
  archivedDate: string | null;
  totalLoggedTime: number;
  milestone: boolean;
  progress: number | null;
  isSuspended: boolean;
  suspendReason: string | null;
  parentId: string | null;
  tags: string[] | null;
  customFields: unknown[] | null;
  url: string | null;
  hasAttachments: boolean;
  duration: number | null;
  sortOrder: number;
  parentRelativeSortOrder: number | null;
};
