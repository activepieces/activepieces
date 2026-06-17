import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addEventAuth } from './lib/auth';
import { addEventCreateEventAction } from './lib/actions/create-event';
import { addEventUpdateEventAction } from './lib/actions/update-event';
import { addEventDeleteEventAction } from './lib/actions/delete-event';
import { addEventFindEventAction } from './lib/actions/find-event';
import { addEventFindOrCreateEventAction } from './lib/actions/find-or-create-event';
import { addEventCreateRsvpAttendeeAction } from './lib/actions/create-rsvp-attendee';
import { addEventDeleteCalendarSubscriberAction } from './lib/actions/delete-calendar-subscriber';
import { addEventCreateAddToCalendarLinksAction } from './lib/actions/create-add-to-calendar-links';
import { addEventNewCalendarSubscriberTrigger } from './lib/triggers/new-calendar-subscriber';
import { addEventNewRsvpAttendeeTrigger } from './lib/triggers/new-rsvp-attendee';
import { addEventApi } from './lib/common/client';

export const addEvent = createPiece({
  displayName: 'AddEvent',
  description:
    'Create and manage calendars, events, and RSVPs with AddEvent — the add-to-calendar service.',
  auth: addEventAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/add-event.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['onyedikachi-david'],
  actions: [
    addEventCreateEventAction,
    addEventUpdateEventAction,
    addEventDeleteEventAction,
    addEventFindEventAction,
    addEventFindOrCreateEventAction,
    addEventCreateRsvpAttendeeAction,
    addEventDeleteCalendarSubscriberAction,
    addEventCreateAddToCalendarLinksAction,
    createCustomApiCallAction({
      baseUrl: () => addEventApi.baseUrl,
      auth: addEventAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    addEventNewCalendarSubscriberTrigger,
    addEventNewRsvpAttendeeTrigger,
  ],
});
