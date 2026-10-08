import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest, paginatedResult } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listVerifiedWebsitesActionOutputSchema } from '../output-schemas';

export const listVerifiedWebsites = createAction({
  auth: pinterestAuth,
  name: 'listVerifiedWebsites',
  classification: 'READ',
  outputSchema: listVerifiedWebsitesActionOutputSchema,
  displayName: 'List Verified Websites',
  description: 'List the websites claimed by the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the websites the connected account has claimed, with the verification status and method for each. Use it to check whether a domain is claimed before publishing Pins that link to it, since claimed domains attribute traffic back to the account. Read-only and idempotent; claiming a new website needs a scope this connection does not hold.',
    idempotent: true,
  },
  props: {
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      description: 'Websites per page (1-250, Pinterest defaults to 25).',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description:
        'Opaque cursor returned by a previous call; omit to read the first page.',
    }),
  },
  async run({ auth, propsValue }) {
    const { page_size, bookmark } = propsValue;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath('/user_account/websites', { page_size, bookmark })
    );

    return paginatedResult(response);
  },
});
