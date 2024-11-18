import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const rename = createAction({
  auth: sftpAuth,
  name: 'rename',
  displayName: 'Rename file or directory',
  description: 'Rename a file or directory',
  props: {
    oldPath: Property.ShortText({
      displayName: 'Old Path',
      required: true,
    }),
    newPath: Property.ShortText({
      displayName: 'New Path',
      required: true,
    }),
  },
  async run(context) {
    const { host, port, username, password } = context.auth;
    const oldPath = context.propsValue['oldPath'];
    const newPath = context.propsValue['newPath'];
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
