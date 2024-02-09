import { createAction, Property } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { sftpAuth } from '../..';

export const createFile = createAction({
  auth: sftpAuth,
  name: 'create_file',
  displayName: 'Create File from Text',
  description: 'Create a new file in the given path',
  props: {
    fileName: Property.ShortText({
      displayName: 'File Path',
      required: true,
    }),
    fileContent: Property.LongText({
      displayName: 'File content',
      required: true,
    }),
  },
  async run(context) {
    const host = context.auth.host;
    const port = context.auth.port;
    const username = context.auth.username;
    const password = context.auth.password;
    const fileName = context.propsValue['fileName'];
    const fileContent = context.propsValue['fileContent'];
    const sftp = new Client();

    try {
      await sftp.connect({
        host,
        port,
        username,
        password,
      });

      const remotePathExists = await sftp.exists(fileName);
      if (!remotePathExists) {
        // Extract the directory path from the fileName
        const remoteDirectory = fileName.substring(
          0,
          fileName.lastIndexOf('/')
        );

        // Create the directory if it doesn't exist
        await sftp.mkdir(remoteDirectory, true); // The second argument 'true' makes the function create all intermediate directories

        // You can also check if the directory was successfully created and handle any potential errors here
      }

      await sftp.put(Buffer.from(fileContent), fileName);
      await sftp.end();

      return {
        status: 'success',
      };
    } catch (err) {
      return {
        status: 'error',
        error: err,
      };
    }
  },
});
