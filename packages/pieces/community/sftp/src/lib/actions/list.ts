import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const listFolderContentsAction = createAction({
  auth: sftpAuth,
  name: 'listFolderContents',
  displayName: 'List Folder Contents',
  description: 'Lists the contents of a given folder.',
  props: {
    directoryPath: Property.ShortText({
      displayName: 'Directory Path',
      required: true,
      description: 'The path of the folder to list e.g. `./myfolder`',
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
