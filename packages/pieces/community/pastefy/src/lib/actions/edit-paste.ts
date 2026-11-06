import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAiProps } from '../common/ai-props';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyProps } from '../common/props';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'edit_paste',
  classification: 'WRITE',
  displayName: 'Edit Paste',
  description: 'Changes a paste you own. Empty fields stay unchanged.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates a paste you own by ID, changing only the given fields (content, title, folder picked from a dropdown, visibility, expiry, tags) and returns the updated paste. An encrypted paste stays encrypted; changing its content or title needs its password. Re-applying the same values gives the same result, so it is idempotent. Needs an API key in the Pastefy connection.',
    idempotent: true,
  },
  props: {
    paste_id: pastefyAiProps.pasteId(),
    content: Property.LongText({ displayName: 'Content', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    password: Property.ShortText({ displayName: 'Encryption Password', description: 'Needed to edit an encrypted paste; on a plain paste it encrypts it.', required: false }),
    folder_id: pastefyProps.folderDropdown({ required: false, displayName: 'Folder', description: 'Move the paste to this folder.' }),
    visibility: pastefyProps.visibility({ required: false, description: 'New visibility.' }),
    expiry: Property.DateTime({ displayName: 'Expiry Date', required: false }),
    tags: pastefyProps.tags({ description: 'Replaces all tags of the paste.' }),
    clear_tags: Property.Checkbox({ displayName: 'Clear Tags', description: 'Remove all tags (ignored when Tags is filled).', required: false, defaultValue: false }),
  },
  outputSchema: pastefyOutputSchemas.paste,
  async run({ auth, propsValue }) {
    return pastefyRequests.editPaste({
      auth,
      pasteId: propsValue.paste_id,
      input: {
        content: propsValue.content,
        title: propsValue.title,
        password: propsValue.password,
        folderId: propsValue.folder_id,
        visibility: propsValue.visibility,
        expiry: propsValue.expiry,
        tags: propsValue.tags,
        clearTags: propsValue.clear_tags,
      },
    });
  },
});
