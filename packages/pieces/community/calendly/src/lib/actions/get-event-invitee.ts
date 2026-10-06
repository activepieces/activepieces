import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { eventInviteeOutputSchema } from '../output-schemas';

export const getEventInviteeAction = createAction({
  auth: calendlyAuth,
  name: 'get_event_invitee',
  classification: 'READ',
  displayName: 'Get Event Invitee',
  description: 'Gets one invitee of a booked meeting.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one invitee of a booked Calendly meeting by the invitee URI (or its UUID plus the scheduled event): name, email, status, timezone, booking question answers, UTM tracking, payment, no-show record and cancel/reschedule URLs. Read-only.',
    idempotent: true,
  },
  outputSchema: eventInviteeOutputSchema,
  props: {
    invitee: calendlyCommon.invitee,
    scheduledEvent: calendlyCommon.optionalScheduledEvent,
  },
  async run({ auth, propsValue }) {
    const inviteeUri = calendlyCommon.toInviteeUri({
      invitee: propsValue.invitee,
      scheduledEvent: propsValue.scheduledEvent,
    });
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: new URL(inviteeUri).pathname,
    });
    return response.resource;
  },
});
