import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { createWorkspaceActionOutputSchema } from '../../../output-schemas';
import { makeClient } from '../../../common';

export const createWorkspaceAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_workspace',
  classification: 'WRITE',
  displayName: 'Create Workspace',
  description: 'Creates a new workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new monday.com workspace, open to the whole account or closed to invited members. Use before creating boards or folders for a new team or project. Account admins may restrict who can create workspaces. Each call creates another workspace, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createWorkspaceActionOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'Open workspaces are visible to everyone in the account; closed ones only to members.',
      required: true,
      defaultValue: 'open',
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    account_product_id: Property.ShortText({
      displayName: 'Account Product ID',
      description: 'The account product (e.g. work management, CRM) to create the workspace in. Defaults to the main product.',
      required: false,
    }),
  },
  async run(context) {
    const { name, kind, description, account_product_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ create_workspace: MondayWorkspace }>({
      query: `mutation ($name: String!, $kind: WorkspaceKind!, $description: String, $account_product_id: ID) {
        create_workspace(name: $name, kind: $kind, description: $description, account_product_id: $account_product_id) {
          id
          name
          kind
          description
          state
          created_at
        }
      }`,
      variables: {
        name,
        kind,
        description: description || undefined,
        account_product_id: account_product_id || undefined,
      },
    });

    const workspace = data.create_workspace;
    return {
      id: workspace.id,
      name: workspace.name,
      kind: workspace.kind ?? null,
      description: workspace.description ?? null,
      state: workspace.state ?? null,
      created_at: workspace.created_at ?? null,
    };
  },
});

type MondayWorkspace = {
  id: string;
  name: string;
  kind: string | null;
  description: string | null;
  state: string | null;
  created_at: string | null;
};
