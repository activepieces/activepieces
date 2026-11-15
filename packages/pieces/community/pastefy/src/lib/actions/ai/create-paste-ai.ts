import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAiProps } from '../../common/ai-props';
import { pastefyAuth } from '../../common/auth';
import { pastefyOutputSchemas } from '../../common/output-schemas';
import { pastefyProps } from '../../common/props';
import { pastefyRequests } from '../../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'create_paste_ai',
  classification: 'WRITE',
  displayName: 'Create Paste (by Folder ID)',
  description: 'Creates a paste, with the folder given by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new paste (code or text snippet) and returns it with its ID and raw_url. Optional: title, folder_id (from List Folders; the step fails if Pastefy did not file it there), visibility PUBLIC/UNLISTED/PRIVATE (default UNLISTED), expiry as an ISO 8601 date-time in the future, tags, and an encryption password that AES-encrypts content and title before upload. Creates a new paste on every call, so it is not idempotent. Works without an API key (anonymous paste); folder_id needs a key.',
    idempotent: false,
  },
  props: {
    content: Property.LongText({ displayName: 'Content', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    password: Property.ShortText({ displayName: 'Encryption Password', description: 'Encrypts content and title with this password.', required: false }),
    folder_id: pastefyAiProps.folderId({ required: false, displayName: 'Folder ID', description: 'Folder ID from List Folders.' }),
    visibility: pastefyProps.visibility({ required: false, description: 'PUBLIC, UNLISTED or PRIVATE. Default UNLISTED.' }),
    expiry: Property.ShortText({ displayName: 'Expiry Date', description: 'ISO 8601 date-time, for example 2026-12-31T18:00:00Z.', required: false }),
    tags: pastefyProps.tags({ description: 'Tags to add.' }),
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
