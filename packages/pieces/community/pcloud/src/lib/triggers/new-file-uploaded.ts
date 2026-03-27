import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';
import { common, PcloudListFolderResponse, PcloudMetadata } from '../common';

function extractFiles(metadata: PcloudMetadata): PcloudMetadata[] {
  const files: PcloudMetadata[] = [];
  if (metadata.contents) {
    for (const item of metadata.contents) {
      if (!item.isfolder) {
        files.push(item);
      }
    }
  }
  return files;
}

export const pcloudNewFileUploaded = createTrigger({
  auth: pcloudAuth,
  name: 'pcloud_new_file_uploaded',
  displayName: 'New File Uploaded',
  description:
    'Automatically process or back up files as soon as they are added to a designated folder, such as saving incoming invoices for accounting.',

  type: TriggerStrategy.POLLING,

  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The ID of the folder to watch. Use 0 for root.',
      required: true,
      defaultValue: 0,
    }),
  },

  sampleData: {
    name: 'report.pdf',
    fileid: 12345678,
    size: 204800,
    contenttype: 'application/pdf',
    created: 'Thu, 27 Mar 2026 12:00:00 +0000',
    modified: 'Thu, 27 Mar 2026 12:00:00 +0000',
    isfolder: false,
  },

  onEnable: async (context) => {
    const response =
      await common.pcloudRequest<PcloudListFolderResponse>(
        context.auth,
        'listfolder',
        { folderid: context.propsValue.folderId },
      );
    const files = extractFiles(response.metadata);
    const knownIds = files.map((f) => f.fileid).filter(Boolean);
    await context.store.put('knownFileIds', knownIds);
  },

  onDisable: async (context) => {
    await context.store.delete('knownFileIds');
  },

  run: async (context) => {
    const response =
      await common.pcloudRequest<PcloudListFolderResponse>(
        context.auth,
        'listfolder',
        { folderid: context.propsValue.folderId },
      );
    const files = extractFiles(response.metadata);
    const knownIds =
      (await context.store.get<number[]>('knownFileIds')) ?? [];
    const knownSet = new Set(knownIds);
    const newFiles = files.filter((f) => f.fileid && !knownSet.has(f.fileid));

    if (newFiles.length > 0) {
      const updatedIds = files.map((f) => f.fileid).filter(Boolean);
      await context.store.put('knownFileIds', updatedIds);
    }

    return newFiles;
  },

  test: async (context) => {
    const response =
      await common.pcloudRequest<PcloudListFolderResponse>(
        context.auth,
        'listfolder',
        { folderid: context.propsValue.folderId },
      );
    return extractFiles(response.metadata).slice(0, 5);
  },
});
