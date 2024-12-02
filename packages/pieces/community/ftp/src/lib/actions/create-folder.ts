import { ftp, ftpAuth } from '../..';
import { Client } from 'basic-ftp';
import { createAction, Property } from '@activepieces/pieces-framework';

export const createFolder = createAction({
  auth: ftpAuth,
  name: 'createFolder',
  displayName: 'Create folder',
  description: 'Create a folder in the FTP server',
  props: {
    directory: Property.ShortText({
      displayName: 'Folder path',
      required: true,
      description: 'The path of the folder you would like to create. It will created nested folders if necessary.  e.g. `./input/`',
    })
  },
  async run(context) {
    const { host, port, user, password, secure } = context.auth;
    const remoteDirectory = context.propsValue['directory'];
    const client = new Client();

    try {
      await client.access({
        host,
        port,
        user,
        password,
        secure,
      });
   
      // Check if the path & file exists
      await client.ensureDir(remoteDirectory)
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