import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { updateFolderActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { mondayClient } from '../../../common/client';

export const updateFolderAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_folder',
  classification: 'WRITE',
  displayName: 'Update Folder',
  description: "Updates a folder's name, color, parent folder or workspace.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Rename, recolor, or move a monday.com folder to another parent folder or workspace. Only the fields you provide are changed; omitted fields keep their current value. Setting the same values again leaves the folder unchanged, so it is safe to retry.",
    idempotent: true,
  },
  outputSchema: updateFolderActionOutputSchema,
  props: {
    folder_id: mondayAiProps.folderId(),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Folder color enum value, e.g. DONE_GREEN, BRIGHT_BLUE, WORKING_ORANGE, STUCK_RED.',
      required: false,
    }),
    parent_folder_id: Property.ShortText({
      displayName: 'New Parent Folder ID',
      description: 'Move the folder under this folder. Resolve it with List Folders.',
      required: false,
    }),
    workspace_id: Property.ShortText({
      displayName: 'New Workspace ID',
      description: 'Move the folder to this workspace. Resolve it with List Workspaces.',
      required: false,
    }),
  },
  async run(context) {
    const { folder_id, name, color, parent_folder_id, workspace_id } = context.propsValue;
    const changes = {
      ...(name ? { name } : {}),
      ...(color ? { color } : {}),
      ...(parent_folder_id ? { parent_folder_id } : {}),
      ...(workspace_id ? { workspace_id } : {}),
    };
    if (Object.keys(changes).length === 0) {
      throw new Error('Provide at least one field to update.');
    }

    const client = makeClient(context.auth);
    const preservedColor = isNil(color) ? await readCurrentColor({ client, folderId: folder_id }) : null;
    const changesWithPreserved = {
      ...changes,
      ...(isNil(preservedColor) ? {} : { color: preservedColor }),
    };

    const argumentTypes: Record<string, string> = {
      name: 'String',
      color: 'FolderColor',
      parent_folder_id: 'ID',
      workspace_id: 'ID',
    };
    const suppliedKeys = Object.keys(changesWithPreserved);
    const variableDeclarations = suppliedKeys.map((key) => `, $${key}: ${argumentTypes[key]}`).join('');
    const argumentList = suppliedKeys.map((key) => `, ${key}: $${key}`).join('');

    const data = await client.query<{ update_folder: MondayFolder }>({
      query: `mutation ($folder_id: ID!${variableDeclarations}) {
        update_folder(folder_id: $folder_id${argumentList}) {
          id
          name
          color
          workspace { id }
          parent { id }
        }
      }`,
      variables: { folder_id, ...changesWithPreserved },
    });

    const folder = data.update_folder;
    return {
      id: folder.id,
      name: folder.name,
      color: folder.color ?? null,
      workspace_id: folder.workspace?.id ?? null,
      parent_folder_id: folder.parent?.id ?? null,
    };
  },
});

async function readCurrentColor({ client, folderId }: { client: mondayClient; folderId: string }): Promise<string | null> {
  const data = await client.query<{ folders: { color: string | null }[] | null }>({
    query: `query ($ids: [ID!]) {
      folders(ids: $ids) {
        color
      }
    }`,
    variables: { ids: [folderId] },
  });
  return data.folders?.[0]?.color ?? null;
}

type MondayFolder = {
  id: string;
  name: string;
  color: string | null;
  workspace: { id: string } | null;
  parent: { id: string } | null;
};
