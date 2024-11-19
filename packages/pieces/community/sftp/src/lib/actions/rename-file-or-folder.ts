import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const renameFileOrFolderAction = createAction({
  auth: sftpAuth,
  name: 'renameFileOrFolder',
  displayName: 'Rename File or Folder',
  description: 'Renames a file or folder at given path.',
  props: {
    oldPath: Property.ShortText({
      displayName: 'Old Path',
      required: true,
      description:
        'The path of the file or folder to rename e.g. `./myfolder/test.mp3`',
    }),
    newPath: Property.ShortText({
      displayName: 'New Path',
      required: true,
      description:
        'The new path of the file or folder e.g. `./myfolder/new-name.mp3`',
    }),
  },
  async run(context) {
    const { host, port, username, password } = context.auth;
    const oldPath = context.propsValue.oldPath;
    const newPath = context.propsValue.newPath;
    const sftp = new Client();

    try {
      await sftp.connect({
        host,
        port,
        username,
        password,
        readyTimeout: 15000,
      });

      await sftp.rename(oldPath, newPath);

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
