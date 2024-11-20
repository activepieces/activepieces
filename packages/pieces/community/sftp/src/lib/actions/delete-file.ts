import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const deleteFileAction = createAction({
  auth: sftpAuth,
  name: 'deleteFile',
  displayName: 'Delete file',
  description: 'Deletes a file at given path.',
  props: {
    filePath: Property.ShortText({
      displayName: 'File Path',
      required: true,
      description: 'The path of the file to delete e.g. `./myfolder/test.mp3`',
    }),
  },
  async run(context) {
    const { host, port, username, password } = context.auth;
    const filePath = context.propsValue.filePath;
    const sftp = new Client();

    try {
      await sftp.connect({
        host,
        port,
        username,
        password,
        readyTimeout: 15000,
      });

      await sftp.delete(filePath);

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
