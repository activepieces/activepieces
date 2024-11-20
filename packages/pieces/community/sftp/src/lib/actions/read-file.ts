import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const readFileContent = createAction({
  auth: sftpAuth,
  name: 'read_file_content',
  displayName: 'Read File Content',
  description: 'Read the content of a file.',
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

    await sftp.connect({
      host,
      port,
      username,
      password,
      readyTimeout: 15000,
    });

    const fileContent = await sftp.get(filePath);
    const fileName = filePath.split('/').pop() ?? filePath;
    await sftp.end();

    return {
      file: await context.files.write({
        fileName: fileName,
        data: fileContent as Buffer,
      }),
    };
  },
});
