import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { cancellationOutputSchema } from '../output-schemas';

export const cancelScheduledEventAction = createAction({
  auth: calendlyAuth,
  name: 'cancel_scheduled_event',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Event',
  description: 'Cancels a booked meeting and notifies the invitees.',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancel one upcoming booked Calendly meeting by URI or UUID; Calendly emails the invitees with the optional Reason. Past meetings, already canceled meetings and meetings the connected user does not host cannot be canceled. Cannot be undone; confirm with the user first.',
    idempotent: false,
  },
  outputSchema: cancellationOutputSchema,
  props: {
    scheduledEvent: calendlyCommon.scheduledEvent,
    reason: Property.LongText({
      displayName: 'Reason',
      description: 'Shown to the invitees. Up to 10,000 characters.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: `/scheduled_events/${calendlyCommon.toUuid({ value: propsValue.scheduledEvent })}/cancellation`,
      body: calendlyCommon.isProvided(propsValue.reason) ? { reason: propsValue.reason } : {},
    });
    return response.resource;
  },
});
