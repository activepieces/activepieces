import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { calendlyCommon } from './lib/common';
import { calendlyInviteeCanceled } from './lib/trigger/invitee-canceled.trigger';
import { calendlyInviteeCreated } from './lib/trigger/invitee-created.trigger';
import { calendlyAuth } from './lib/auth';
import { cancelScheduledEventAction } from './lib/actions/cancel-scheduled-event';
import { createEventTypeAction } from './lib/actions/create-event-type';
import { createOneOffEventTypeAction } from './lib/actions/create-one-off-event-type';
import { createSchedulingLinkAction } from './lib/actions/create-scheduling-link';
import { createShareAction } from './lib/actions/create-share';
import { findInviteeBookingsAction } from './lib/actions/find-invitee-bookings';
import { findUserAction } from './lib/actions/find-user';
import { getEventInviteeAction } from './lib/actions/get-event-invitee';
import { getEventTypeAvailabilityAction } from './lib/actions/get-event-type-availability';
import { getEventTypeAction } from './lib/actions/get-event-type';
import { getOrganizationMembershipAction } from './lib/actions/get-organization-membership';
import { getOrganizationAction } from './lib/actions/get-organization';
import { getScheduledEventAction } from './lib/actions/get-scheduled-event';
import { getUserAvailabilityScheduleAction } from './lib/actions/get-user-availability-schedule';
import { getUserAction } from './lib/actions/get-user';
import { listAvailableTimesAction } from './lib/actions/list-available-times';
import { listEventInviteesAction } from './lib/actions/list-event-invitees';
import { listEventTypeHostsAction } from './lib/actions/list-event-type-hosts';
import { listEventTypesAction } from './lib/actions/list-event-types';
import { listOrganizationMembershipsAction } from './lib/actions/list-organization-memberships';
import { listScheduledEventsAction } from './lib/actions/list-scheduled-events';
import { listUserAvailabilitySchedulesAction } from './lib/actions/list-user-availability-schedules';
import { listUserBusyTimesAction } from './lib/actions/list-user-busy-times';
import { listUserLocationsAction } from './lib/actions/list-user-locations';
import { updateEventTypeAvailabilityAction } from './lib/actions/update-event-type-availability';
import { updateEventTypeAction } from './lib/actions/update-event-type';

export const calendly = createPiece({
  displayName: 'Calendly',
  description: 'Simple, modern scheduling',
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/calendly.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  auth: calendlyAuth,
  actions: [
    cancelScheduledEventAction,
    createEventTypeAction,
    createOneOffEventTypeAction,
    createSchedulingLinkAction,
    createShareAction,
    findInviteeBookingsAction,
    findUserAction,
    getEventInviteeAction,
    getEventTypeAvailabilityAction,
    getEventTypeAction,
    getOrganizationMembershipAction,
    getOrganizationAction,
    getScheduledEventAction,
    getUserAvailabilityScheduleAction,
    getUserAction,
    listAvailableTimesAction,
    listEventInviteesAction,
    listEventTypeHostsAction,
    listEventTypesAction,
    listOrganizationMembershipsAction,
    listScheduledEventsAction,
    listUserAvailabilitySchedulesAction,
    listUserBusyTimesAction,
    listUserLocationsAction,
    updateEventTypeAvailabilityAction,
    updateEventTypeAction,
    createCustomApiCallAction({
      baseUrl: () => calendlyCommon.baseUrl,
      auth: calendlyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [calendlyInviteeCreated, calendlyInviteeCanceled],
});
