import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CLIENT_HEADERS, TRANSCRIPTFETCH_BASE_URL } from './common';

const markdownDescription = `
Create a free TranscriptFetch account at [transcriptfetch.com](https://transcriptfetch.com), then copy an API key from the [dashboard](https://transcriptfetch.com/app). Free accounts include 50 credits a month.
`;

export const transcriptFetchAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      // Free authenticated endpoint: a wrong key fails, a right one returns the balance.
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${TRANSCRIPTFETCH_BASE_URL}/api/v2/me`,
        headers: { Authorization: `Bearer ${auth}`, ...CLIENT_HEADERS },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key.' };
    }
  },
});
