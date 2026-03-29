import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { pcloudAuth, folderId, API_BASE_URL } from '../auth';

/**
 * Polling trigger for new folders
 * Checks for new folders in a parent folder periodically
 */
interface TrackingData {
  lastChecked: number;
  knownFolderIds: string[];
}

const getNewFolders = async (context: any) => {
  let tracking = await context.store?.get<TrackingData>(`pcloud_folder_${context.propsValue.folder_id}`);
  if (!tracking) {
    tracking = { lastChecked: 0, knownFolderIds: [] };
  }

  const response = await httpClient.sendRequest<any>({
    method: 'GET',
    url: `${API_BASE_URL}/listfolder`,
    queryParams: {
      access_token: context.auth as string,
      folderid: context.propsValue.folder_id,
    },
  });

  const folders = response.body.metadata?.contents?.filter((m: any) => m.isfolder && !m.isdeleted) || [];
  const newFolders = folders.filter((f: any) => !tracking.knownFolderIds.includes(String(f.folderid)));

  // Update tracking data
  const allFolderIds = folders.map((f: any) => String(f.folderid));
  await context.store?.put<TrackingData>(`pcloud_folder_${context.propsValue.folder_id}`, {
    lastChecked: Date.now(),
    knownFolderIds: allFolderIds,
  });

  return newFolders;
};

export const newFolderTrigger = createTrigger({
  auth: pcloudAuth,
  name: 'new_folder',
  displayName: 'New Folder',
  description: 'Triggers when a new folder is created',
  type: TriggerStrategy.POLLING,
  props: {
    folder_id: folderId,
  },
  sampleData: {
    folderid: '12345',
    name: 'New Folder',
    path: '/New Folder',
    created: 'Wed, 29 Mar 2026 06:00:00 +0000',
  },

  async test(context) {
    return await getNewFolders(context);
  },

  async onEnable(context) {
    const response = await httpClient.sendRequest<any>({
      method: 'GET',
      url: `${API_BASE_URL}/listfolder`,
      queryParams: {
        access_token: context.auth as string,
        folderid: context.propsValue.folder_id,
      },
    });

    const folders = response.body.metadata?.contents?.filter((m: any) => m.isfolder && !m.isdeleted) || [];
    const folderIds = folders.map((f: any) => String(f.folderid));

    await context.store?.put<TrackingData>(`pcloud_folder_${context.propsValue.folder_id}`, {
      lastChecked: Date.now(),
      knownFolderIds: folderIds,
    });
  },

  async onDisable(context) {
    await context.store?.delete(`pcloud_folder_${context.propsValue.folder_id}`);
  },

  async run(context) {
    return await getNewFolders(context);
  },
});
