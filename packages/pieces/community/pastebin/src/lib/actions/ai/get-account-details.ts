import { createAction } from '@activepieces/pieces-framework';

import { pastebinAuth } from '../../auth';
import { pastebinApi } from '../../common/api';
import { pastebinGetAccountDetailsOutputSchema } from '../../output-schemas';

export const pastebinGetAccountDetailsAction = createAction({
  auth: pastebinAuth,
  name: 'pastebin_get_account_details',
  outputSchema: pastebinGetAccountDetailsOutputSchema,
  displayName: 'Get Account Details',
  description: "Gets the connected account's details and paste defaults.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets the connected Pastebin account's username, email, account type (0 free, 1 PRO) and its default paste format, privacy (0 public, 1 unlisted, 2 private) and expiry. Use it to match Create Paste to the user's own defaults. Needs the username and password on the connection.",
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await pastebinApi.getAccountDetails({ auth: context.auth });
  },
});
