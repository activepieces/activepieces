import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { userLocationsOutputSchema } from '../output-schemas';

export const listUserLocationsAction = createAction({
  auth: calendlyAuth,
  name: 'list_user_locations',
  classification: 'SEARCH',
  displayName: 'List User Meeting Locations',
  description: 'Lists the meeting location types a user has set up.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the meeting location kinds a Calendly user can use (zoom_conference, google_conference, physical, ...) and whether each one is connected. Check this before choosing a location for Create Event Type or Create One-Off Meeting Link. Defaults to the connected user. Read-only.',
    idempotent: true,
  },
  outputSchema: userLocationsOutputSchema,
  props: {
    user: calendlyCommon.user,
  },
  async run({ auth, propsValue }) {
    const user = await calendlyCommon.resolveUserUri({ token: auth.secret_text, user: propsValue.user });
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/locations',
      queryParams: { user },
    });
    return { items: response.collection, count: response.collection.length };
  },
});
