import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const list = createAction({
  auth: sftpAuth,
  name: 'list',
  displayName: 'List',
  description: 'List the contents of a directory',
  props: {
    directoryPath: Property.ShortText({
      displayName: 'Directory Path',
      required: true,
    }),
  },
  async run(context) {
    const { host, port, username, password } = context.auth;
    const directoryPath = context.propsValue['directoryPath'];
    const sftp = new Client();

    try {
      await sftp.connect({
        host,
        port,
        username,
        password,
        readyTimeout: 15000,
      });

      const contents = await sftp.list(directoryPath);

      return {
        status: 'success',
        contents: contents,
      };
    } catch (err) {
      return {
        status: 'error',
        contents: null,
        error: err,
      };
    } finally {
      await sftp.end();
    }
  },
});
