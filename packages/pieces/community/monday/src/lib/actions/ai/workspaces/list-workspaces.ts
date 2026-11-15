import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { listWorkspacesActionOutputSchema } from '../../../output-schemas';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const listWorkspacesAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_workspaces',
  classification: 'SEARCH',
  displayName: 'List Workspaces',
  description: 'Lists workspaces.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List monday.com workspaces the connected user can see, with kind (open/closed), state and description. Use to resolve a workspace name to the workspace ID needed by List Boards, Create Board, List Folders and the workspace membership actions. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listWorkspacesActionOutputSchema,
  props: {
    workspace_ids: Property.Array({
      displayName: 'Workspace IDs',
      description: 'Only return these workspaces.',
      required: false,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      defaultValue: 'active',
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Archived', value: 'archived' },
          { label: 'Deleted', value: 'deleted' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    membership_kind: Property.StaticDropdown({
      displayName: 'Membership',
      description: 'Only workspaces the user is a member of, or all visible workspaces.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All visible', value: 'all' },
          { label: 'Member of', value: 'member' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Workspaces per page (default 50).',
      required: false,
      defaultValue: 50,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { kind, state, membership_kind, limit, page } = context.propsValue;
    const ids = mondayApi.toStringArray(context.propsValue.workspace_ids);

    const data = await makeClient(context.auth).query<{ workspaces: MondayWorkspace[] }>({
      query: `query ($ids: [ID!], $kind: WorkspaceKind, $state: State, $membership_kind: WorkspaceMembershipKind, $limit: Int, $page: Int) {
        workspaces(ids: $ids, kind: $kind, state: $state, membership_kind: $membership_kind, limit: $limit, page: $page) {
          id
          name
          kind
          description
          state
          created_at
          is_default_workspace
        }
      }`,
      variables: {
        ids: ids.length > 0 ? ids : undefined,
        kind: kind ?? undefined,
        state: state ?? 'active',
        membership_kind: membership_kind ?? 'all',
        limit: limit ?? 50,
        page: page ?? 1,
      },
    });

    const workspaces = data.workspaces.map(toFlatWorkspace);
    return { workspaces, count: workspaces.length };
  },
});

function toFlatWorkspace(workspace: MondayWorkspace) {
  return {
    id: workspace.id,
    name: workspace.name,
    kind: workspace.kind ?? null,
    description: workspace.description ?? null,
    state: workspace.state ?? null,
    created_at: workspace.created_at ?? null,
    is_default_workspace: workspace.is_default_workspace ?? false,
  };
}

type MondayWorkspace = {
  id: string;
  name: string;
  kind: string | null;
  description: string | null;
  state: string | null;
  created_at: string | null;
  is_default_workspace: boolean | null;
};
