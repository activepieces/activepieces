import { ftpAuth } from '../..';
import { Client } from 'basic-ftp';
import { createAction, Property } from '@activepieces/pieces-framework';
import { fileURLToPath } from 'url';

export const removeAFile = createAction({
  auth: ftpAuth,
  name: 'removeAFile',
  displayName: 'Delete a file',
  description: 'Delete a file from a given path',
  props: {
    filePath: Property.ShortText({
      displayName: 'File path',
      required: true,
      description: 'Path to file to be deleted. e.g. `./input/doc.pdf`',
    })
  },
  async run(context) {
    const { host, port, user, password, secure } = context.auth;
    const filePath = context.propsValue['filePath'];
    const client = new Client();

    try {
      await client.access({
        host,
        port,
        user,
        password,
        secure,
      });

      const response = await client.remove(filePath);
      return {
        status: 'success',
        response: response,
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