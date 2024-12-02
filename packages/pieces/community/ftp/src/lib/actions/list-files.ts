import { ftpAuth } from '../..';
import { Client } from 'basic-ftp';
import { createAction, Property } from '@activepieces/pieces-framework';

export const listFiles = createAction({
  auth: ftpAuth,
  name: 'listFiles',
  displayName: 'List files',
  description: 'List files in an FTP directory.',
  props: {
    directoryPath: Property.ShortText({
      displayName: 'Directory path',
      required: true,
      description: 'List contents of a given folder. e.g. `./input/`',
    })
  },
  async run(context) {
    const { host, port, user, password, secure } = context.auth;
    const directoryPath = context.propsValue['directoryPath'];
    const client = new Client();

    try {
      await client.access({
        host,
        port,
        user,
        password,
        secure,
      });

      const contents = await client.list(directoryPath);
      const transformedContents = contents.map(item => ({
        ...item,
        type: item.type === 1 ? 'File' : item.type === 2 ? 'Folder' : 'Unknown',
      }));
      
      return {
        status: 'success',
        contents: transformedContents,
      };
    } catch (err) {
      return {
        status: 'error',
        contents: null,
        error: err,
      }
    } finally {
      client.close();
    }
  },
});