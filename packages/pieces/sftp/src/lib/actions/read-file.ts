import { sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';

export const readFileContent = createAction({
  auth: sftpAuth,
  name: 'read_file_content',
  displayName: 'Read File Content',
  description: 'Read the content of a file',
  props: {
    filePath: Property.ShortText({
      displayName: 'File Path',
      required: true
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: true,
      defaultValue: 'base64',
      options: {
        options: [
          {
            value: 'Text',
            label: 'utf8'
          },
          {
            value: 'base64',
            label: 'Base64'
          }
        ]
      }
    })
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
      readyTimeout: 15000
    });

    const fileContent = await sftp.get(filePath);
    await sftp.end();

    return {
      base64: fileContent.toString(context.propsValue.outputFormat === 'base64' ? 'base64' : 'utf8')
    };
  }
});
