import { Property, createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty, isNil, tryCatch } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { getClient, getProtocolBackwardCompatibility, endClient } from '../common';
import { sftpAuth } from '../auth';
import dayjs from 'dayjs';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient, FTPError, FileInfo as FTPFileInfo, FileType as FTPFileType } from 'basic-ftp';
import { newOrModifiedFileTriggerOutputSchema } from '../output-schemas';

const FTP_FILE_UNAVAILABLE = 550;

async function getModifyTime({ client, file, protocol, directory, serverCanTimestamp }: { client: Client | FTPClient; file: Client.FileInfo | FTPFileInfo; protocol: string; directory: string; serverCanTimestamp: boolean }): Promise<number | null> {
  if (protocol === 'sftp') {
    return (file as Client.FileInfo).modifyTime;
  }

  const ftpFile = file as FTPFileInfo;
  if (!isNil(ftpFile.modifiedAt)) {
    return dayjs(ftpFile.modifiedAt).valueOf();
  }
  if (ftpFile.type === FTPFileType.Directory) {
    return null;
  }
  if (!serverCanTimestamp) {
    return Date.now();
  }

  const { data, error } = await tryCatch(() => (client as FTPClient).lastMod(`${directory.replace(/\/+$/, '')}/${ftpFile.name}`));
  if (isNil(error)) {
    return dayjs(data).valueOf();
  }

  const serverRefusedThisEntry = error instanceof FTPError && error.code === FTP_FILE_UNAVAILABLE;
  if (serverRefusedThisEntry) {
    return null;
  }
  throw error;
}

async function serverCanTimestampEntries({ client, protocol, files }: { client: Client | FTPClient; protocol: string; files: (Client.FileInfo | FTPFileInfo)[] }): Promise<boolean> {
  const listingCarriesTimes = protocol === 'sftp' || files.every(file => !isNil((file as FTPFileInfo).modifiedAt));
  if (listingCarriesTimes) {
    return true;
  }
  const features = await (client as FTPClient).features();
  return features.has('MDTM');
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof sftpAuth>, { path: string; ignoreHiddenFiles?: boolean }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    let client: Client | FTPClient | null = null;
    try {
      const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(auth.props.protocol);
      client = await getClient(auth.props);
      const files = await client.list(propsValue.path);

      const visibleFiles: (Client.FileInfo | FTPFileInfo)[] = propsValue.ignoreHiddenFiles ?
        files.filter(file => !file.name.startsWith('.')) :
        files;

      const serverCanTimestamp = await serverCanTimestampEntries({ client, protocol: protocolBackwardCompatibility, files: visibleFiles });

      const newFiles: { data: unknown; epochMilliSeconds: number }[] = [];
      for (const file of visibleFiles) {
        const modifyTime = await getModifyTime({ client, file, protocol: protocolBackwardCompatibility, directory: propsValue.path, serverCanTimestamp });
        if (isNil(modifyTime) || modifyTime <= lastFetchEpochMS) {
          continue;
        }
        newFiles.push({
          data: {
            ...file,
            path: `${propsValue.path}/${file.name}`,
          },
          epochMilliSeconds: modifyTime,
        });
      }
      return newFiles;
    } finally {
      if (client) {
        await endClient(client, auth.props.protocol);
      }
    }
  },
};

export const newOrModifiedFile = createTrigger({
  auth: sftpAuth,
  name: 'new_file',
  classification: 'READ',
  displayName: 'New File',
  description: 'Trigger when a new file is created or modified.',
  aiMetadata: {
    description: 'Fires for each file in a watched directory on an FTP, FTPS or SFTP server whose modification time is newer than the previous poll, so it covers both newly added files and edits to existing ones. Each event represents one such file. Polls a single directory only, without recursing into subfolders, and can optionally skip hidden dotfiles.',
  },
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
  outputSchema: newOrModifiedFileTriggerOutputSchema,
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
