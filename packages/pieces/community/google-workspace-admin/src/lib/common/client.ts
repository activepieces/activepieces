import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAccessToken, GoogleWorkspaceAdminAuthValue } from '../auth';

async function request<T>({
  auth,
  method,
  url,
  body,
  queryParams,
}: {
  auth: GoogleWorkspaceAdminAuthValue;
  method: HttpMethod;
  url: string;
  body?: unknown;
  queryParams?: Record<string, string | number | boolean | undefined>;
}): Promise<T> {
  const token = await getAccessToken(auth);
  const response = await httpClient.sendRequest<T>({
    method,
    url,
    body,
    queryParams: toQueryParams(queryParams),
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
  });
  return response.body;
}

async function listAll<R extends { nextPageToken?: string }, T>({
  auth,
  url,
  getItems,
  queryParams,
  limit,
}: {
  auth: GoogleWorkspaceAdminAuthValue;
  url: string;
  getItems: (response: R) => T[] | undefined;
  queryParams?: Record<string, string | number | boolean | undefined>;
  limit?: number;
}): Promise<T[]> {
  const max = limit ?? Number.MAX_SAFE_INTEGER;
  let items: T[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const response: R = await request<R>({
      auth,
      method: HttpMethod.GET,
      url,
      queryParams: {
        ...queryParams,
        maxResults: Math.min(PAGE_SIZE, max - items.length),
        pageToken,
      },
    });
    items = [...items, ...(getItems(response) ?? [])];
    pageToken = response.nextPageToken;
  } while (pageToken && items.length < max);
  return items.slice(0, max);
}

async function getCustomerId({ auth }: { auth: GoogleWorkspaceAdminAuthValue }): Promise<string> {
  const customer = await request<{ id: string }>({
    auth,
    method: HttpMethod.GET,
    url: `${DIRECTORY_URL}/customers/my_customer`,
  });
  return customer.id;
}

async function getUserId({
  auth,
  userKey,
}: {
  auth: GoogleWorkspaceAdminAuthValue;
  userKey: string;
}): Promise<string> {
  const user = await request<{ id: string }>({
    auth,
    method: HttpMethod.GET,
    url: `${DIRECTORY_URL}/users/${encodeURIComponent(userKey)}`,
    queryParams: { fields: 'id' },
  });
  return user.id;
}

async function getUser({
  auth,
  userKey,
}: {
  auth: GoogleWorkspaceAdminAuthValue;
  userKey: string;
}): Promise<DirectoryUser> {
  return request<DirectoryUser>({
    auth,
    method: HttpMethod.GET,
    url: `${DIRECTORY_URL}/users/${encodeURIComponent(userKey)}`,
  });
}

function flattenUser(user: DirectoryUser) {
  return {
    id: user.id,
    primary_email: user.primaryEmail,
    first_name: user.name?.givenName ?? null,
    last_name: user.name?.familyName ?? null,
    full_name: user.name?.fullName ?? null,
    is_admin: user.isAdmin ?? false,
    is_delegated_admin: user.isDelegatedAdmin ?? false,
    suspended: user.suspended ?? false,
    suspension_reason: user.suspensionReason ?? null,
    archived: user.archived ?? false,
    org_unit_path: user.orgUnitPath ?? null,
    change_password_at_next_login: user.changePasswordAtNextLogin ?? false,
    is_enrolled_in_2sv: user.isEnrolledIn2Sv ?? false,
    is_enforced_in_2sv: user.isEnforcedIn2Sv ?? false,
    recovery_email: user.recoveryEmail ?? null,
    recovery_phone: user.recoveryPhone ?? null,
    aliases: (user.aliases ?? []).join(', '),
    creation_time: user.creationTime ?? null,
    last_login_time: user.lastLoginTime ?? null,
    customer_id: user.customerId ?? null,
    thumbnail_photo_url: user.thumbnailPhotoUrl ?? null,
  };
}

function compact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function toQueryParams(
  params?: Record<string, string | number | boolean | undefined>,
): Record<string, string> | undefined {
  if (!params) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

const PAGE_SIZE = 100;

export const DIRECTORY_URL = 'https://admin.googleapis.com/admin/directory/v1';
export const LICENSING_URL = 'https://licensing.googleapis.com/apps/licensing/v1';
export const DATA_TRANSFER_URL = 'https://admin.googleapis.com/admin/datatransfer/v1';
export const REPORTS_URL = 'https://admin.googleapis.com/admin/reports/v1';

export const googleAdminClient = {
  request,
  listAll,
  getCustomerId,
  getUserId,
  getUser,
  flattenUser,
  compact,
};

export type DirectoryUser = {
  id: string;
  primaryEmail: string;
  name?: { givenName?: string; familyName?: string; fullName?: string };
  isAdmin?: boolean;
  isDelegatedAdmin?: boolean;
  suspended?: boolean;
  suspensionReason?: string;
  archived?: boolean;
  orgUnitPath?: string;
  changePasswordAtNextLogin?: boolean;
  isEnrolledIn2Sv?: boolean;
  isEnforcedIn2Sv?: boolean;
  recoveryEmail?: string;
  recoveryPhone?: string;
  aliases?: string[];
  creationTime?: string;
  lastLoginTime?: string;
  customerId?: string;
  thumbnailPhotoUrl?: string;
};

export type DirectoryGroup = {
  id: string;
  email: string;
  name: string;
  description?: string;
  directMembersCount?: string;
  adminCreated?: boolean;
  aliases?: string[];
};

export type GroupMember = {
  id: string;
  email?: string;
  role?: string;
  type?: string;
  status?: string;
  delivery_settings?: string;
};

export type OrgUnit = {
  orgUnitId: string;
  orgUnitPath: string;
  name: string;
  description?: string;
  parentOrgUnitPath?: string;
  parentOrgUnitId?: string;
  blockInheritance?: boolean;
};

export type AdminRole = {
  roleId: string;
  roleName: string;
  roleDescription?: string;
  isSystemRole?: boolean;
  isSuperAdminRole?: boolean;
};

export type RoleAssignment = {
  roleAssignmentId: string;
  roleId: string;
  assignedTo: string;
  assigneeType?: string;
  scopeType: string;
  orgUnitId?: string;
};
