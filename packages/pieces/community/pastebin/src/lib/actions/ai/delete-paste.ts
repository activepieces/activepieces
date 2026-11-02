import { Property, createAction } from '@activepieces/pieces-framework';

import { pastebinAuth } from '../../auth';
import { pastebinApi } from '../../common/api';
import { pastebinDeletePasteOutputSchema } from '../../output-schemas';

export const pastebinDeletePasteAction = createAction({
  auth: pastebinAuth,
  name: 'pastebin_delete_paste',
  outputSchema: pastebinDeletePasteOutputSchema,
  displayName: 'Delete Paste',
  description: "Permanently deletes one of the account's pastes.",
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      "Permanently deletes one of the connected account's own pastes by its paste key; it can't be undone. Get the key from List Pastes or Create Paste. Needs the username and password on the connection.",
    idempotent: false,
  },
  props: {
    pasteKey: Property.ShortText({
      displayName: 'Paste Key',
      description: 'The paste key, from List Pastes or Create Paste.',
      required: true,
    }),
  },
  async run(context) {
    const message = await pastebinApi.deletePaste({
      auth: context.auth,
      pasteKey: context.propsValue.pasteKey,
    });
    return { paste_key: context.propsValue.pasteKey, message };
  },
});
