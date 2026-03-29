import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { pcloudAuth } from '../..';
import { pcloudCommon, PcloudMetadata } from '../common';

function collectAllFolders(metadata: PcloudMetadata): PcloudMetadata[] {
  const folders: PcloudMetadata[] = [];
  if (metadata.contents) {
    for (const item of metadata.contents) {
      if (item.isfolder) {
        folders.push(item);
        if (item.contents) {
          folders.push(...collectAllFolders(item));
        }
      }
    }
  }
  return folders;
}

export const pcloudNewFolder = createTrigger({
  auth: pcloudAuth,
  name: 'new_folder',
  displayName: 'Folder Created',
  description:
    'Initiate onboarding workflows whenever project folders are created by team members.',
  type: TriggerStrategy.POLLING,
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description:
        'The ID of the parent folder to watch for new subfolders. Use 0 for the root folder.',
      required: true,
      defaultValue: 0,
    }),
    recursive: Property.Checkbox({
      displayName: 'Include Subfolders',
      description: 'Watch subfolders recursively for new folders.',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    name: 'Project Docs',
    created: 'Wed, 01 Jan 2025 12:00:00 +0000',
    modified: 'Wed, 01 Jan 2025 12:00:00 +0000',
    isfolder: true,
    folderid: 87654321,
    path: '/My Documents/Project Docs',
    parentfolderid: 0,
  },
  onEnable: async (context) => {
    const response = await pcloudCommon.listFolder(
      context.auth,
      context.propsValue.folderId,
      context.propsValue.recursive ?? false,
    );
    const folders = collectAllFolders(response.metadata);
    const knownFolderIds = folders.map((f) => f.folderid);
    await context.store.put('knownFolderIds', knownFolderIds);
  },
  onDisable: async (context) => {
    await context.store.delete('knownFolderIds');
  },
  run: async (context) => {
    const response = await pcloudCommon.listFolder(
      context.auth,
      context.propsValue.folderId,
      context.propsValue.recursive ?? false,
    );
    const allFolders = collectAllFolders(response.metadata);
    const knownFolderIds =
      (await context.store.get<number[]>('knownFolderIds')) ?? [];
    const knownSet = new Set(knownFolderIds);

    const newFolders = allFolders.filter(
      (f) => f.folderid && !knownSet.has(f.folderid),
    );
    const updatedIds = allFolders.map((f) => f.folderid);
    await context.store.put('knownFolderIds', updatedIds);

    return newFolders;
  },
  test: async (context) => {
    const response = await pcloudCommon.listFolder(
      context.auth,
      context.propsValue.folderId,
      context.propsValue.recursive ?? false,
    );
    const allFolders = collectAllFolders(response.metadata);
    return allFolders.slice(0, 5);
  },
});
