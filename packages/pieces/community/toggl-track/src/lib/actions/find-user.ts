import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi, TwoOrganizationUser } from '../common/client';
import { togglModels } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const findUser = createAction({
  auth: togglTrackAuth,
  name: 'find_user',
  classification: 'SEARCH',
  displayName: 'Find User',
  description: 'Find a user in a workspace by their name or email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the members of a workspace, optionally filtered by name or email. Returns an array with id, user_id, name, email, and active. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    organization_id: togglCommon.organization_id,
    search_term: Property.ShortText({
      displayName: 'Name or Email',
      description: 'The name or email of the user to find.',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active Users Only',
      description: 'Return only active users.',
      required: false,
      defaultValue: true,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page.',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.userList,
  async run(context) {
    const { search_term, active, page, per_page } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });

    if (togglApi.isTwo(auth)) {
      const queryParams: QueryParams = { workspaces: String(workspaceId) };
      if (search_term) queryParams['filter'] = search_term;
      const users = await togglApi.listTwoPageOrAll<TwoOrganizationUser>({
        auth,
        path: `/organizations/${togglApi.twoOrganizationId(auth)}/users`,
        queryParams,
        page: page ?? undefined,
        perPage: per_page ?? undefined,
      });
      return users
        .filter((user) =>
          user.workspaces.some((workspace) => workspace.id === workspaceId)
        )
        .filter((user) => (active ? user.active : true))
        .map((user) => togglModels.user({ item: user, workspaceId }));
    }

    const organizationId = togglApi.requireId({
      value: context.propsValue.organization_id,
      label: 'Organization',
    });
    const queryParams: QueryParams = {};
    if (search_term) queryParams['search'] = search_term;
    if (active !== undefined && active !== null)
      queryParams['active'] = active.toString();
    if (page) queryParams['page'] = page.toString();
    if (per_page) queryParams['per_page'] = per_page.toString();

    const users = await togglApi.request<Record<string, unknown>[] | null>({
      auth,
      method: togglApi.HttpMethod.GET,
      path: `/organizations/${organizationId}/workspaces/${workspaceId}/workspace_users`,
      queryParams,
    });
    return users ?? [];
  },
});
