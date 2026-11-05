import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Gets the profile of the connected Spotify account',
  audience: 'both',
  aiMetadata: {
    description: "Returns the connected Spotify account's profile (user id, display name, account id, images). Email, country and subscription are only returned for apps with extended access. Use it to learn whose library and playlists the connection acts on. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['currentUser'],
  props: {},
  async run({ auth }) {
    const client = makeClient({ auth });
    return client.getCurrentUser();
  },
});
