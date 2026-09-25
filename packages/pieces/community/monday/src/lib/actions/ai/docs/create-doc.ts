import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { createDocActionOutputSchema } from '../../../output-schemas';

export const createDocAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_doc',
  classification: 'WRITE',
  displayName: 'Create Doc',
  description: 'Creates an empty monday doc in a workspace or in an item doc column.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create an empty monday.com doc either in a workspace (needs workspace ID and name) or inside a doc column on an item (needs item ID and doc column ID). Add content afterwards with Append Markdown to Doc; to create a doc with content in one step from HTML use Import Doc from HTML. Each call creates a new doc.',
    idempotent: false,
  },
  outputSchema: createDocActionOutputSchema,
  props: {
    location: Property.StaticDropdown({
      displayName: 'Location',
      required: true,
      defaultValue: 'workspace',
      options: {
        options: [
          { label: 'Workspace', value: 'workspace' },
          { label: 'Item doc column', value: 'item' },
        ],
      },
    }),
    workspace_id: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Required for the workspace location. Resolve it with List Workspaces.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Doc Name',
      description: 'Required for the workspace location.',
      required: false,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Doc Kind',
      description: 'Access level for a workspace doc (default public).',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
          { label: 'Shareable', value: 'share' },
        ],
      },
    }),
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description: 'Required for the item location. Resolve it with List Board Items.',
      required: false,
    }),
    column_id: Property.ShortText({
      displayName: 'Doc Column ID',
      description: 'Required for the item location: the ID of a doc-type column. Resolve it with List Columns.',
      required: false,
    }),
  },
  async run(context) {
    const { location, workspace_id, name, kind, item_id, column_id } = context.propsValue;

    const docLocation = buildLocation({
      location,
      workspaceId: workspace_id,
      name,
      kind,
      itemId: item_id,
      columnId: column_id,
    });

    const data = await makeClient(context.auth).query<{ create_doc: CreatedDoc | null }>({
      query: `mutation ($location: CreateDocInput!) {
        create_doc(location: $location) {
          id
          object_id
          name
          url
          workspace_id
        }
      }`,
      variables: { location: docLocation },
    });

    const doc = data.create_doc;
    if (!doc) {
      throw new Error('monday.com did not return the created doc.');
    }

    return {
      id: doc.id,
      object_id: doc.object_id,
      name: doc.name,
      url: doc.url ?? null,
      workspace_id: doc.workspace_id ?? null,
    };
  },
});

function buildLocation({
  location,
  workspaceId,
  name,
  kind,
  itemId,
  columnId,
}: {
  location: string;
  workspaceId: string | undefined;
  name: string | undefined;
  kind: string | undefined;
  itemId: string | undefined;
  columnId: string | undefined;
}): Record<string, unknown> {
  if (location === 'item') {
    if (!itemId || !columnId) {
      throw new Error('Item ID and Doc Column ID are required to create a doc in an item doc column.');
    }
    return { board: { item_id: itemId, column_id: columnId } };
  }
  if (!workspaceId || !name) {
    throw new Error('Workspace ID and Doc Name are required to create a doc in a workspace.');
  }
  return {
    workspace: {
      workspace_id: workspaceId,
      name,
      ...(kind ? { kind } : {}),
    },
  };
}

type CreatedDoc = {
  id: string;
  object_id: string;
  name: string;
  url: string | null;
  workspace_id: string | null;
};
