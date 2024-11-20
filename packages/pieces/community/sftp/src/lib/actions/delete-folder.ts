import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const deleteFolderAction = createAction({
  auth: sftpAuth,
  name: 'deleteFolder',
  displayName: 'Delete Folder',
  description: 'Deletes an existing folder at given path.',
  props: {
    folderPath: Property.ShortText({
      displayName: 'Folder Path',
      required: true,
      description: 'The path of the folder to delete e.g. `./myfolder`',
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      defaultValue: false,
      required: false,
      description:
        'Enable this option to delete the folder and all its contents, including subfolders and files.',
    }),
  },
  async run(context) {
    const { host, port, username, password } = context.auth;
    const directoryPath = context.propsValue.folderPath;
    const recursive = context.propsValue.recursive ?? false;
    const sftp = new Client();

    try {
      await sftp.connect({
        host,
        port,
        username,
        password,
        readyTimeout: 15000,
      });

      await sftp.rmdir(directoryPath, recursive);

      return {
        status: 'success',
      };
    } catch (err) {
      return {
        status: 'error',
        error: err,
      };
    } finally {
      await sftp.end();
    }
  },
});
