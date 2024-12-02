import { ftpAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { Client } from 'basic-ftp';

export const renameFile = createAction({
  auth: ftpAuth,
  name: 'renameFile',
  displayName: 'Rename file',
  description: 'Rename a file or folder in a given path. Can also be used to move a file.',
  props: {
    information: Property.MarkDown({
      value: 'Depending on the server you can also use this to move a file to another directory, as long as the directory exists.',
      variant: MarkdownVariant.INFO,
    }),
    oldPath: Property.ShortText({
      displayName: 'Old Path',
      required: true,
      description:
        'The path of the file or folder to rename e.g. `./input/doc.pdf`',
    }),
    newPath: Property.ShortText({
      displayName: 'New Path',
      required: true,
      description:
        'The new path of the file or folder e.g. `./output/doc.pdf`',
    }),
  },
  async run(context) {
    const info = context.propsValue.information;
    const { host, port, user, password, secure } = context.auth;
    const oldPath = context.propsValue.oldPath;
    const newPath = context.propsValue.newPath;
    const client = new Client();

    try {
      await client.access({
        host,
        port,
        user,
        password,
        secure,
      });

      const response = await client.rename(oldPath, newPath);
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
