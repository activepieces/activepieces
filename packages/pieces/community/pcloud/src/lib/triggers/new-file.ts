import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { pcloudAuth } from '../..';
import { pcloudCommon, PcloudMetadata } from '../common';

function collectAllFiles(metadata: PcloudMetadata): PcloudMetadata[] {
  const files: PcloudMetadata[] = [];
  if (metadata.contents) {
    for (const item of metadata.contents) {
      if (!item.isfolder) {
        files.push(item);
      }
      if (item.isfolder && item.contents) {
        files.push(...collectAllFiles(item));
      }
    }
  }
  return files;
}

export const pcloudNewFile = createTrigger({
  auth: pcloudAuth,
  name: 'new_file',
  displayName: 'New File Uploaded',
  description:
    'Automatically process or back up files as soon as they are added to a designated folder.',
  type: TriggerStrategy.POLLING,
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description:
        'The ID of the folder to watch for new files. Use 0 for the root folder.',
      required: true,
      defaultValue: 0,
    }),
    recursive: Property.Checkbox({
      displayName: 'Include Subfolders',
      description: 'Watch subfolders recursively for new files.',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    name: 'report.pdf',
    created: 'Wed, 01 Jan 2025 12:00:00 +0000',
    modified: 'Wed, 01 Jan 2025 12:00:00 +0000',
    isfolder: false,
    fileid: 12345678,
    path: '/My Documents/report.pdf',
    parentfolderid: 0,
    contenttype: 'application/pdf',
    size: 102400,
  },
  onEnable: async (context) => {
    const response = await pcloudCommon.listFolder(
      context.auth,
      context.propsValue.folderId,
      context.propsValue.recursive ?? false,
    );
    const files = collectAllFiles(response.metadata);
    const knownFileIds = files.map((f) => f.fileid).filter(Boolean) as number[];
    await context.store.put('knownFileIds', knownFileIds);
  },
  onDisable: async (context) => {
    await context.store.delete('knownFileIds');
  },
  run: async (context) => {
    const response = await pcloudCommon.listFolder(
      context.auth,
      context.propsValue.folderId,
      context.propsValue.recursive ?? false,
    );
    const allFiles = collectAllFiles(response.metadata);
    const knownFileIds =
      (await context.store.get<number[]>('knownFileIds')) ?? [];
    const knownSet = new Set(knownFileIds);

    const newFiles = allFiles.filter((f) => f.fileid && !knownSet.has(f.fileid));
    const updatedIds = allFiles.map((f) => f.fileid).filter(Boolean) as number[];

    context.store.put('knownFileIds', updatedIds);
    return newFiles;
  },
  test: async (context) => {
    const response = await pcloudCommon.listFolder(
      context.auth,
      context.propsValue.folderId,
      context.propsValue.recursive ?? false,
    );
    const allFiles = collectAllFiles(response.metadata);
    return allFiles.slice(0, 5);
  },
});
