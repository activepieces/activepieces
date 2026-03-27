import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';
import { common, PcloudListFolderResponse, PcloudMetadata } from '../common';

function extractFolders(metadata: PcloudMetadata): PcloudMetadata[] {
  const folders: PcloudMetadata[] = [];
  if (metadata.contents) {
    for (const item of metadata.contents) {
      if (item.isfolder) {
        folders.push(item);
      }
    }
  }
  return folders;
}

export const pcloudFolderCreated = createTrigger({
  auth: pcloudAuth,
  name: 'pcloud_folder_created',
  displayName: 'Folder Created',
  description:
    'Initiate onboarding workflows whenever project folders are created by team members.',

  type: TriggerStrategy.POLLING,

  props: {
    folderId: Property.Number({
      displayName: 'Parent Folder ID',
      description:
        'The ID of the parent folder to watch for new subfolders. Use 0 for root.',
      required: true,
      defaultValue: 0,
    }),
  },

  sampleData: {
    name: 'New Project',
    folderid: 87654321,
    created: 'Thu, 27 Mar 2026 12:00:00 +0000',
    modified: 'Thu, 27 Mar 2026 12:00:00 +0000',
    isfolder: true,
  },

  onEnable: async (context) => {
    const response =
      await common.pcloudRequest<PcloudListFolderResponse>(
        context.auth,
        'listfolder',
        { folderid: context.propsValue.folderId },
      );
    const folders = extractFolders(response.metadata);
    const knownIds = folders.map((f) => f.folderid).filter(Boolean);
    await context.store.put('knownFolderIds', knownIds);
  },

  onDisable: async (context) => {
    await context.store.delete('knownFolderIds');
  },

  run: async (context) => {
    const response =
      await common.pcloudRequest<PcloudListFolderResponse>(
        context.auth,
        'listfolder',
        { folderid: context.propsValue.folderId },
      );
    const folders = extractFolders(response.metadata);
    const knownIds =
      (await context.store.get<number[]>('knownFolderIds')) ?? [];
    const knownSet = new Set(knownIds);
    const newFolders = folders.filter(
      (f) => f.folderid && !knownSet.has(f.folderid),
    );

    if (newFolders.length > 0) {
      const updatedIds = folders.map((f) => f.folderid).filter(Boolean);
      await context.store.put('knownFolderIds', updatedIds);
    }

    return newFolders;
  },

  test: async (context) => {
    const response =
      await common.pcloudRequest<PcloudListFolderResponse>(
        context.auth,
        'listfolder',
        { folderid: context.propsValue.folderId },
      );
    return extractFolders(response.metadata).slice(0, 5);
  },
});
