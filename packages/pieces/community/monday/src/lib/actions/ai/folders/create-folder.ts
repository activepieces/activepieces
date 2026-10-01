import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { createFolderActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const createFolderAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_folder',
  classification: 'WRITE',
  displayName: 'Create Folder',
  description: 'Creates a folder in a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a folder in a monday.com workspace, optionally nested under a parent folder, to organize boards and docs. Use before placing boards with Create Board or Move Board. Each call creates another folder even with the same name, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createFolderActionOutputSchema,
  props: {
    workspace_id: mondayAiProps.workspaceId(),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    parent_folder_id: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'Nest the new folder under this folder. Resolve it with List Folders.',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Folder color enum value, e.g. DONE_GREEN, BRIGHT_BLUE, WORKING_ORANGE, STUCK_RED.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace_id, name, parent_folder_id, color } = context.propsValue;

    const data = await makeClient(context.auth).query<{ create_folder: MondayFolder }>({
      query: `mutation ($name: String!, $workspace_id: ID, $parent_folder_id: ID, $color: FolderColor) {
        create_folder(name: $name, workspace_id: $workspace_id, parent_folder_id: $parent_folder_id, color: $color) {
          id
          name
          color
          created_at
          workspace { id }
          parent { id }
        }
      }`,
      variables: {
        name,
        workspace_id,
        parent_folder_id: parent_folder_id || undefined,
        color: color || undefined,
      },
    });

    const folder = data.create_folder;
    return {
      id: folder.id,
      name: folder.name,
      color: folder.color ?? null,
      created_at: folder.created_at,
      workspace_id: folder.workspace?.id ?? workspace_id,
      parent_folder_id: folder.parent?.id ?? null,
    };
  },
});

type MondayFolder = {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  workspace: { id: string } | null;
  parent: { id: string } | null;
};
