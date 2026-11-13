import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi, TwoOrganizationUser } from '../common/client';
import { togglOutputSchemas } from '../output-schemas';

export const listOrganizationUsers = createAction({
  auth: togglTrackAuth,
  name: 'list_organization_users',
  classification: 'SEARCH',
  displayName: 'List Organization Users',
  description: 'List the members of an organization.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every member of the organization across its workspaces, optionally filtered by name or email. Use Find User for a single workspace. Read-only.',
    idempotent: true,
  },
  props: {
    organization_id: togglCommon.organization_id,
    search: Property.ShortText({
      displayName: 'Name or Email',
      description: 'Only members whose name or email contains this text.',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.organizationUserList,
  async run(context) {
    const auth = context.auth;
    const search = context.propsValue.search?.trim();
    const filters: QueryParams = search ? { filter: search } : {};

    if (togglApi.isTwo(auth)) {
      const users = await togglApi.listTwoPages<TwoOrganizationUser>({
        auth,
        path: `/organizations/${togglApi.twoOrganizationId(auth)}/users`,
        queryParams: filters,
      });
      return users.map((user) => ({
        id: user.id,
        user_id: user.user_account_id,
        name: user.name,
        email: user.email,
        admin: null,
        owner: user.owner ?? null,
        inactive: !user.active,
        joined: user.joined ?? null,
        workspace_ids: user.workspaces.map((workspace) => workspace.id),
      }));
    }

    const organizationId = togglApi.requireId({
      value: context.propsValue.organization_id,
      label: 'Organization',
    });
    const users = await listClassicPages({
      auth,
      path: `/organizations/${organizationId}/users`,
      filters,
      page: 1,
    });
    return users.map((user) => ({
      ...user,
      workspace_ids: (user.workspaces ?? []).map(
        (workspace) => workspace.workspace_id
      ),
    }));
  },
});

async function listClassicPages({
  auth,
  path,
  filters,
  page,
}: {
  auth: Parameters<typeof togglApi.request>[0]['auth'];
  path: string;
  filters: QueryParams;
  page: number;
}): Promise<ClassicOrgUser[]> {
  if (page > MAX_PAGES) {
    throw new Error(
      `The organization has more than ${PAGE_SIZE * MAX_PAGES} members. Use the Name or Email filter.`
    );
  }
  const users =
    (await togglApi.request<ClassicOrgUser[] | null>({
      auth,
      method: togglApi.HttpMethod.GET,
      path,
      queryParams: {
        ...filters,
        page: String(page),
        per_page: String(PAGE_SIZE),
      },
    })) ?? [];
  if (users.length < PAGE_SIZE) {
    return users;
  }
  const rest = await listClassicPages({ auth, path, filters, page: page + 1 });
  return [...users, ...rest];
}

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

type ClassicOrgUser = {
  workspaces?: { workspace_id: number }[] | null;
  [key: string]: unknown;
};
