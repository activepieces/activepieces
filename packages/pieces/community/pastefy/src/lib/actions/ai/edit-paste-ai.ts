import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAiProps } from '../../common/ai-props';
import { pastefyAuth } from '../../common/auth';
import { pastefyOutputSchemas } from '../../common/output-schemas';
import { pastefyProps } from '../../common/props';
import { pastefyRequests } from '../../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'edit_paste_ai',
  classification: 'WRITE',
  displayName: 'Update Paste (by IDs)',
  description: 'Changes a paste you own, with paste and folder given by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates a paste you own by paste_id and returns the updated paste. Only the fields you give change: content, title, folder_id (from List Folders), visibility, expiry (ISO 8601, future), tags (replace all) or clear_tags. An encrypted paste stays encrypted; changing its content or title needs its password, and a password on a plain paste encrypts it (content required). Re-applying the same values gives the same result, so it is idempotent. Needs an API key in the Pastefy connection.',
    idempotent: true,
  },
  props: {
    paste_id: pastefyAiProps.pasteId(),
    content: Property.LongText({ displayName: 'Content', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    password: Property.ShortText({ displayName: 'Encryption Password', required: false }),
    folder_id: pastefyAiProps.folderId({ required: false, displayName: 'Folder ID', description: 'Move the paste to this folder (ID from List Folders).' }),
    visibility: pastefyProps.visibility({ required: false, description: 'PUBLIC, UNLISTED or PRIVATE.' }),
    expiry: Property.ShortText({ displayName: 'Expiry Date', description: 'ISO 8601 date-time in the future.', required: false }),
    tags: pastefyProps.tags({ description: 'Replaces all tags.' }),
    clear_tags: Property.Checkbox({ displayName: 'Clear Tags', description: 'Remove all tags (ignored when Tags is given).', required: false, defaultValue: false }),
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
