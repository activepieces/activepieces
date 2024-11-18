import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const deleteFile = createAction({
  auth: sftpAuth,
  name: 'delete_file',
  displayName: 'Delete file',
  description: 'Delete a file',
  props: {
    filePath: Property.ShortText({
      displayName: 'File Path',
      required: true,
    }),
  },
  async run(context) {
    const { host, port, username, password } = context.auth;
    const filePath = context.propsValue['filePath'];
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
