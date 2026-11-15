import { createAction, Property } from '@activepieces/pieces-framework';
import { imapAuth, performImapOperation, ImapError, assertHeaderSafe } from '../common';
import { createFolderOutputSchema } from '../output-schemas';

export const createFolder = createAction({
  auth: imapAuth,
  name: 'create_folder',
  classification: 'WRITE',
  displayName: 'Create Folder',
  description: 'Creates a folder, optionally inside a parent folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an IMAP folder, optionally nested under an existing parent path from list_folders. Use before move_emails or copy_emails when the target folder does not exist yet. If the folder already exists it returns created=false instead of failing, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Folder Name',
      description:
        'Name of the new folder. Must not contain the server folder separator; use Parent Folder for nesting.',
      required: true,
    }),
    parent_folder: Property.ShortText({
      displayName: 'Parent Folder',
      description: 'Optional existing folder path from list_folders to create the folder inside.',
      required: false,
    }),
  },
  outputSchema: createFolderOutputSchema,
  async run({ auth, propsValue }) {
    const name = propsValue.name.trim();
    const parent = propsValue.parent_folder?.trim() ?? '';
    if (!name) {
      throw new ImapError('Folder name must not be empty.');
    }
    assertHeaderSafe({ field: 'Folder name', value: name });
    return performImapOperation(auth, async (client) => {
      const folders = await client.list();
      const delimiter = folders.find((entry) => entry.delimiter)?.delimiter ?? '/';
      if (name.includes(delimiter)) {
        throw new ImapError(
          `Folder name must not contain the separator "${delimiter}"; use Parent Folder for nesting.`
        );
      }
      if (parent && !folders.some((entry) => entry.path === parent)) {
        throw new ImapError(
          `Parent folder "${parent}" does not exist; pick a path from list_folders.`
        );
      }
      const expectedPath = parent ? `${parent}${delimiter}${name}` : name;
      const existing = folders.find((entry) => entry.path === expectedPath);
      if (existing) {
        return { path: existing.path, created: false };
      }
      try {
        const result = await client.mailboxCreate(parent ? [parent, name] : name);
        return { path: result.path, created: result.created };
      } catch (error) {
        const after = await client.list();
        const match = after.find((entry) => entry.path === expectedPath);
        if (match) {
          return { path: match.path, created: false };
        }
        throw error;
      }
    });
  },
});
