import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { listFoldersActionOutputSchema } from '../../../output-schemas';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const listFoldersAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_folders',
  classification: 'SEARCH',
  displayName: 'List Folders',
  description: 'Lists folders in workspaces.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List monday.com folders with their workspace, parent folder, sub-folders and the boards inside them. Use to resolve a folder name to the folder ID needed by Create Board, Move Board and the folder actions. Filter by workspace IDs or folder IDs; max 100 per page. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listFoldersActionOutputSchema,
  props: {
    workspace_ids: Property.Array({
      displayName: 'Workspace IDs',
      description: 'Only return folders in these workspaces. Resolve them with List Workspaces.',
      required: false,
    }),
    folder_ids: Property.Array({
      displayName: 'Folder IDs',
      description: 'Only return these folders.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Folders per page (default 25, max 100).',
      required: false,
      defaultValue: 25,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { limit, page } = context.propsValue;
    const workspaceIds = mondayApi.toStringArray(context.propsValue.workspace_ids);
    const folderIds = mondayApi.toStringArray(context.propsValue.folder_ids);

    const data = await makeClient(context.auth).query<{ folders: MondayFolder[] }>({
      query: `query ($ids: [ID!], $workspace_ids: [ID], $limit: Int, $page: Int) {
        folders(ids: $ids, workspace_ids: $workspace_ids, limit: $limit, page: $page) {
          id
          name
          color
          created_at
          owner_id
          workspace { id name }
          parent { id name }
          sub_folders { id name }
          children { id name }
        }
      }`,
      variables: {
        ids: folderIds.length > 0 ? folderIds : undefined,
        workspace_ids: workspaceIds.length > 0 ? workspaceIds : undefined,
        limit: Math.min(limit ?? 25, 100),
        page: page ?? 1,
      },
    });

    const folders = data.folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      color: folder.color ?? null,
      created_at: folder.created_at,
      owner_id: folder.owner_id ?? null,
      workspace_id: folder.workspace?.id ?? null,
      workspace_name: folder.workspace?.name ?? null,
      parent_folder_id: folder.parent?.id ?? null,
      parent_folder_name: folder.parent?.name ?? null,
      sub_folder_ids: folder.sub_folders.map((sub) => sub.id).join(', '),
      board_ids: folder.children.filter((board) => board !== null).map((board) => board.id).join(', '),
      board_names: folder.children.filter((board) => board !== null).map((board) => board.name).join(', '),
    }));

    return { folders, count: folders.length };
  },
});

type MondayFolder = {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  owner_id: string | null;
  workspace: { id: string; name: string } | null;
  parent: { id: string; name: string } | null;
  sub_folders: { id: string; name: string }[];
  children: ({ id: string; name: string } | null)[];
};
