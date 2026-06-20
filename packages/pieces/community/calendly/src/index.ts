import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { calendlyCommon } from './lib/common';
import { calendlyInviteeCanceled } from './lib/trigger/invitee-canceled.trigger';
import { calendlyInviteeCreated } from './lib/trigger/invitee-created.trigger';
import { calendlyAuth } from './lib/auth';
import { getCurrentUser } from './lib/actions/get-current-user';
import { listEventTypes } from './lib/actions/list-event-types';
import { getEventType } from './lib/actions/get-event-type';
import { getEventTypeAvailableTimes } from './lib/actions/get-event-type-available-times';
import { getUserBusyTimes } from './lib/actions/get-user-busy-times';
import { getUserAvailabilitySchedules } from './lib/actions/get-user-availability-schedules';
// import { createEventInvitee } from './lib/actions/create-event-invitee';
// import { createSchedulingLink } from './lib/actions/create-scheduling-link';
import { getSchedulingPageLink } from './lib/actions/get-scheduling-page-link';
import { getEmbedWidget } from './lib/actions/get-embed-widget';
import { listScheduledEvents } from './lib/actions/list-scheduled-events';
import { getScheduledEvent } from './lib/actions/get-scheduled-event';
// import { cancelScheduledEvent } from './lib/actions/cancel-scheduled-event';
import { listEventInvitees } from './lib/actions/list-event-invitees';
import { getEventInvitee } from './lib/actions/get-event-invitee';
import { getEventManagementLinks } from './lib/actions/get-event-management-links';
// import { markInviteeNoShow } from './lib/actions/mark-invitee-no-show';
// import { removeInviteeNoShow } from './lib/actions/remove-invitee-no-show';
import { getInviteeNoShow } from './lib/actions/get-invitee-no-show';
import { listOrganizationMemberships } from './lib/actions/list-organization-memberships';
import { getOrganizationMembership } from './lib/actions/get-organization-membership';
// import { listRoutingForms } from './lib/actions/list-routing-forms';
// import { getRoutingForm } from './lib/actions/get-routing-form';
// import { listRoutingFormSubmissions } from './lib/actions/list-routing-form-submissions';
// import { getRoutingFormSubmission } from './lib/actions/get-routing-form-submission';
import { listWebhookSubscriptions } from './lib/actions/list-webhook-subscriptions';

export const calendly = createPiece({
  displayName: 'Calendly',
  description: 'Simple, modern scheduling',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/calendly.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
  ],
  auth: calendlyAuth,
  actions: [
    getCurrentUser,
    listEventTypes,
    getEventType,
    getEventTypeAvailableTimes,
    getUserBusyTimes,
    getUserAvailabilitySchedules,
    // createEventInvitee, // Requires paid Calendly plan
    // createSchedulingLink, // Requires scheduling_links:write scope
    getSchedulingPageLink,
    getEmbedWidget,
    listScheduledEvents,
    getScheduledEvent,
    // cancelScheduledEvent, // Requires scheduled_events:write scope
    listEventInvitees,
    getEventInvitee,
    getEventManagementLinks,
    // markInviteeNoShow,
    // removeInviteeNoShow,
    getInviteeNoShow,
    listOrganizationMemberships,
    getOrganizationMembership,
    // listRoutingForms, // Requires Calendly Teams plan
    // getRoutingForm, // Requires Calendly Teams plan
    // listRoutingFormSubmissions, // Requires Calendly Teams plan
    // getRoutingFormSubmission, // Requires Calendly Teams plan
    listWebhookSubscriptions,
    createCustomApiCallAction({
      baseUrl: () => calendlyCommon.baseUrl,
      auth: calendlyAuth,
      authMapping: async (auth) => ({
        Authorization: calendlyCommon.authorizationHeader(
          calendlyCommon.getToken(auth)
        ),
      }),
    }),
  ],
  triggers: [calendlyInviteeCreated, calendlyInviteeCanceled],
});
