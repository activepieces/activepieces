import { ftpAuth } from '../..';
import { Client } from 'basic-ftp';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Readable } from 'stream';

export const uploadFile = createAction({
  auth: ftpAuth,
  name: 'uploadFile',
  displayName: 'Upload file',
  description: 'Upload a file to a given path',
  props: {
    fileName: Property.ShortText({
      displayName: 'File path',
      required: true,
      description: 'The path on the FTP server to store the file. e.g. `./input/invoice.pdf`',
    }),
    fileContent: Property.File({
      displayName: 'File content',
      required: true,
    })
  },
  async run(context) {
    const { host, port, user, password, secure } = context.auth;
    const fileName = context.propsValue['fileName'];
    const fileContent = context.propsValue['fileContent'];
    const client = new Client();

    try {
      await client.access({
        host,
        port,
        user,
        password,
        secure,
      });

      const remoteDirectory = fileName.substring(
        0,
        fileName.lastIndexOf('/')
      );

      //console.log('#LOG: remoteDir: ' + remoteDirectory)
      
      // Check if the path & file exists
      //const remotePathExists = await client.ensureDir(remoteDirectory)
      await client.uploadFrom(Readable.from(fileContent.data), fileName)
      return {
        status: 'success',
      };
    } catch (err) {
      return {
        status: 'error',
        error: err,
      };
    } finally {
      client.close()
    }
  },
});