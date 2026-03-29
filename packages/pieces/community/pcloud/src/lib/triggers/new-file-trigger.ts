import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { pcloudAuth, folderId, API_BASE_URL } from '../auth';

/**
 * Polling trigger for new files
 * Checks for new files in a folder periodically
 */
interface TrackingData {
  lastChecked: number;
  knownFileIds: string[];
}

const getNewFiles = async (context: any) => {
  let tracking = await context.store?.get<TrackingData>(`pcloud_file_${context.propsValue.folder_id}`);
  if (!tracking) {
    tracking = { lastChecked: 0, knownFileIds: [] };
  }

  const response = await httpClient.sendRequest<any>({
    method: 'GET',
    url: `${API_BASE_URL}/listfolder`,
    queryParams: {
      access_token: context.auth as string,
      folderid: context.propsValue.folder_id,
    },
  });

  const files = response.body.metadata?.contents?.filter((m: any) => !m.isfolder && !m.isdeleted) || [];
  const newFiles = files.filter((f: any) => !tracking.knownFileIds.includes(String(f.fileid)));

  // Update tracking data
  const allFileIds = files.map((f: any) => String(f.fileid));
  await context.store?.put<TrackingData>(`pcloud_file_${context.propsValue.folder_id}`, {
    lastChecked: Date.now(),
    knownFileIds: allFileIds,
  });

  return newFiles;
};

export const newFileTrigger = createTrigger({
  auth: pcloudAuth,
  name: 'new_file',
  displayName: 'New File',
  description: 'Triggers when a new file is added to a folder',
  type: TriggerStrategy.POLLING,
  props: {
    folder_id: folderId,
    include_subfolders: Property.Checkbox({
      displayName: 'Include Subfolders',
      description: 'Watch for new files in subfolders as well',
      required: false,
    }),
  },
  sampleData: {
    fileid: '12345',
    name: 'example.txt',
    path: '/example.txt',
    size: 1024,
    contenttype: 'text/plain',
    created: 'Wed, 29 Mar 2026 06:00:00 +0000',
  },

  async test(context) {
    return await getNewFiles(context);
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

    const files = response.body.metadata?.contents?.filter((m: any) => !m.isfolder && !m.isdeleted) || [];
    const fileIds = files.map((f: any) => String(f.fileid));

    await context.store?.put<TrackingData>(`pcloud_file_${context.propsValue.folder_id}`, {
      lastChecked: Date.now(),
      knownFileIds: fileIds,
    });
  },

  async onDisable(context) {
    await context.store?.delete(`pcloud_file_${context.propsValue.folder_id}`);
  },

  async run(context) {
    return await getNewFiles(context);
  },
});
