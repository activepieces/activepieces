import { PiecePropValueSchema, Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sftpAuth, getClient, getProtocolBackwardCompatibility, endClient } from '../..';
import dayjs from 'dayjs';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient, FileInfo as FTPFileInfo } from 'basic-ftp';

function getModifyTime(file: Client.FileInfo | FTPFileInfo, protocol: string): number {
  return protocol === 'sftp' ? 
    (file as Client.FileInfo).modifyTime :
    dayjs((file as FTPFileInfo).modifiedAt).valueOf();
}

const polling: Polling<PiecePropValueSchema<typeof sftpAuth>, { path: string; ignoreHiddenFiles?: boolean }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    let client: Client | FTPClient | null = null;
    try {
      const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(auth.protocol);
      client = await getClient(auth);
      const files = await client.list(propsValue.path);

      const filteredFiles = files.filter(file => {
        const modTime = getModifyTime(file, protocolBackwardCompatibility);
        return dayjs(modTime).valueOf() > lastFetchEpochMS;
      });

      const finalFiles: (Client.FileInfo | FTPFileInfo)[] = propsValue.ignoreHiddenFiles ? 
        filteredFiles.filter(file => !file.name.startsWith('.')) :
        filteredFiles;

      return finalFiles.map(file => {
        const modTime = getModifyTime(file, protocolBackwardCompatibility);

        return {
          data: {
            ...file,
            path: `${propsValue.path}/${file.name}`,
          },
          epochMilliSeconds: dayjs(modTime).valueOf(),
        };
      });
    } catch (err) {
      return [];
    } finally {
      if (client) {
        await endClient(client, auth.protocol);
      }
    }
  },
};

export const newOrModifiedFile = createTrigger({
  auth: sftpAuth,
  name: 'new_file',
  displayName: 'New File',
  description: 'Trigger when a new file is created or modified.',
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The path to watch for new files',
      required: true,
      defaultValue: './',
    }),
    ignoreHiddenFiles: Property.Checkbox({
      displayName: 'Ignore hidden files',
      description: 'Ignore hidden files',
      required: false,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, context);
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, context);
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },
  test: async (context) => {
    return await pollingHelper.test(polling, context);
  },
  sampleData: null,
});
