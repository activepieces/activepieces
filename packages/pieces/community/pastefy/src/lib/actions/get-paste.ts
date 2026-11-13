import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAiProps } from '../common/ai-props';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'get_paste',
  classification: 'READ',
  displayName: 'Get Paste',
  description: 'Retrieves a paste.',
  audience: 'both',
  aiMetadata: {
    description: 'Gets one paste by its 8-character ID: content, title, visibility, folder ID, tags, owner and raw URL. For an encrypted paste give the encryption password to get plain text (decrypted: true); a wrong password fails the step, and without one the content stays ciphertext. Read-only and idempotent. Works without an API key for public and unlisted pastes.',
    idempotent: true,
  },
  props: {
    paste_id: pastefyAiProps.pasteId(),
    password: Property.ShortText({ displayName: 'Encryption Password', description: 'Decrypts an encrypted paste with this password.', required: false }),
  },
  outputSchema: pastefyOutputSchemas.paste,
  async run({ auth, propsValue }) {
    return pastefyRequests.getPaste({ auth, pasteId: propsValue.paste_id, password: propsValue.password });
  },
});
