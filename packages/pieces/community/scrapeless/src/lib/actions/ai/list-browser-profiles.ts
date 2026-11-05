import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const listBrowserProfilesAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_list_browser_profiles',
  displayName: 'List Browser Profiles',
  description: 'Lists browser profiles, optionally filtered by name.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of browser profiles with their profileId, name, usage count and size, plus total and page counts. Filter with Name; page with Page.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Only profiles whose name matches this.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1. Defaults to 1.',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Profiles per page. Defaults to 20.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.listBrowserProfiles({
      auth,
      name: propsValue.name,
      page: propsValue.page ?? 1,
      pageSize: propsValue.pageSize ?? 20,
    });
  },
});
