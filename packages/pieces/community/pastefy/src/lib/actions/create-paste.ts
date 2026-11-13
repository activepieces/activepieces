import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyProps } from '../common/props';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'create_paste',
  classification: 'WRITE',
  displayName: 'Create Paste',
  description: 'Creates a new paste.',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a new paste with content, optional title, folder picked from a dropdown, visibility, expiry and tags. With an encryption password the content and title are AES-encrypted before upload. Creates a new paste with a new ID on every call, so it is not idempotent. Works without an API key (anonymous paste); a folder needs a key.',
    idempotent: false,
  },
  props: {
    content: Property.LongText({ displayName: 'Content', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    password: Property.ShortText({ displayName: 'Encryption Password', description: 'Encrypts the content and title before upload. It cannot be recovered.', required: false }),
    folder_id: pastefyProps.folderDropdown({ required: false, displayName: 'Folder', description: 'Folder to put the paste in.' }),
    visibility: pastefyProps.visibility({ required: false, description: 'Who can see the paste. Pastefy defaults to Unlisted.' }),
    expiry: Property.DateTime({ displayName: 'Expiry Date', description: 'When Pastefy deletes the paste.', required: false }),
    tags: pastefyProps.tags({ description: 'Tags to add to the paste.' }),
  },
  outputSchema: pastefyOutputSchemas.paste,
  async run({ auth, propsValue }) {
    return pastefyRequests.createPaste({
      auth,
      input: {
        content: propsValue.content,
        title: propsValue.title,
        password: propsValue.password,
        folderId: propsValue.folder_id,
        visibility: propsValue.visibility,
        expiry: propsValue.expiry,
        tags: propsValue.tags,
      },
    });
  },
});
