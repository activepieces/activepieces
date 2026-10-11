import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { updateWorkspaceActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const updateWorkspaceAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_workspace',
  classification: 'WRITE',
  displayName: 'Update Workspace',
  description: "Updates a workspace's name, description, kind or product.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Change a monday.com workspace's name, description, kind (open/closed), or account product. Only the fields you provide are changed; omitted fields keep their current value. To remove the description, set Clear Description. Setting the same values again leaves the workspace unchanged, so it is safe to retry.",
    idempotent: true,
  },
  outputSchema: updateWorkspaceActionOutputSchema,
  props: {
    workspace_id: mondayAiProps.workspaceId(),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    clear_description: Property.Checkbox({
      displayName: 'Clear Description',
      description: 'Remove the current description. Leave unchecked to keep it.',
      required: false,
      defaultValue: false,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'Leave empty to keep the current kind.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    account_product_id: Property.ShortText({
      displayName: 'Account Product ID',
      description: 'Move the workspace to this account product.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace_id, name, description, clear_description, kind, account_product_id } = context.propsValue;
    if (clear_description && !isNil(description) && description !== '') {
      throw new Error('Set either Description or Clear Description, not both.');
    }
    const attributes = {
      ...(name ? { name } : {}),
      ...(clear_description ? { description: '' } : {}),
      ...(!clear_description && !isNil(description) && description !== '' ? { description } : {}),
      ...(kind ? { kind } : {}),
      ...(account_product_id ? { account_product_id } : {}),
    };
    if (Object.keys(attributes).length === 0) {
      throw new Error('Provide at least one field to update.');
    }

    const data = await makeClient(context.auth).query<{ update_workspace: MondayWorkspace }>({
      query: `mutation ($id: ID!, $attributes: UpdateWorkspaceAttributesInput!) {
        update_workspace(id: $id, attributes: $attributes) {
          id
          name
          kind
          description
          state
        }
      }`,
      variables: { id: workspace_id, attributes },
    });

    const workspace = data.update_workspace;
    return {
      id: workspace.id,
      name: workspace.name,
      kind: workspace.kind ?? null,
      description: workspace.description ?? null,
      state: workspace.state ?? null,
    };
  },
});

type MondayWorkspace = {
  id: string;
  name: string;
  kind: string | null;
  description: string | null;
  state: string | null;
};
