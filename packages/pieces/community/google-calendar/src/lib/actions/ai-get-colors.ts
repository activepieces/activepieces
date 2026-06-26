import { createAction } from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../common';
import { getColors } from '../common/helper';

export const aiGetColors = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_get_colors',
  displayName: 'Get Colors',
  description:
    'Fetch the Google Calendar color palette mapping colorId values to their hex background/foreground colors.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch the global color palette: the mapping from each colorId to its background/foreground hex color, for both events and calendars. Use this to resolve a colorId before setting the color on google_calendar_create_event or google_calendar_update_event. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const colors = await getColors(context.auth);
    return colors;
  },
});
