import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { listTimezonesActionOutputSchema } from '../output-schemas';

export const calcomListTimezones = createAction({
  auth: calcomAuth,
  name: 'calcom_list_timezones',
  classification: 'SEARCH',
  displayName: 'List Timezones',
  description: 'List valid IANA timezone strings Cal.com accepts.',
  audience: 'ai',
  outputSchema: listTimezonesActionOutputSchema,
  aiMetadata: {
    description:
      'Lists valid IANA timezone identifiers (e.g. Europe/Berlin), optionally filtered by a search term. Use to find a valid value for actions that take a timezone, such as Create Booking or Create Schedule.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { search, limit } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/timezones',
      query: {
        search,
        limit,
      },
    });
  },
});
