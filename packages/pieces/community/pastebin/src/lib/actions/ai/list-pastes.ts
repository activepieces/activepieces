import { Property, createAction } from '@activepieces/pieces-framework';

import { pastebinAuth } from '../../auth';
import { pastebinApi } from '../../common/api';
import { pastebinListPastesOutputSchema } from '../../output-schemas';

export const pastebinListPastesAction = createAction({
  auth: pastebinAuth,
  name: 'pastebin_list_pastes',
  outputSchema: pastebinListPastesOutputSchema,
  displayName: 'List Pastes',
  description: "Lists the account's own pastes, oldest first.",
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the connected account's own pastes, oldest first (Pastebin's order, so a limit keeps the oldest ones), with each paste's key, title, URL, format, privacy, expiry, size and hits. Use it to find the paste key that Get Paste Content and Delete Paste take. Needs the username and password on the connection.",
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many pastes to return, 1 to 1000. Defaults to 50.',
      required: false,
    }),
  },
  async run(context) {
    const pastes = await pastebinApi.listPastes({
      auth: context.auth,
      limit: context.propsValue.limit,
    });
    return { pastes, count: pastes.length };
  },
});
