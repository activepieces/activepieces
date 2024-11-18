import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const createDir = createAction({
  auth: sftpAuth,
  name: 'createDir',
  displayName: 'Create directory',
  description: 'Create a directory',
  props: {
    directoryPath: Property.ShortText({
      displayName: 'Directory Path',
      required: true,
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const { host, port, username, password } = context.auth;
    const directoryPath = context.propsValue['directoryPath'];
    const recursive = context.propsValue['recursive'] ?? false;
    const sftp = new Client();

    try {
      await sftp.connect({
        host,
        port,
        username,
        password,
        readyTimeout: 15000,
      });

      await sftp.mkdir(directoryPath, recursive);

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
