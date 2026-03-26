import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { eventTypeDropdown } from '../../common/props';

export const createAppointmentAction = createAction({
  name: 'create_appointment',
  displayName: 'Create Appointment',
  description: 'Creates an appointment for a lead.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    eventTypeId: eventTypeDropdown,
    startTime: Property.ShortText({
      displayName: 'Start Time',
      description: 'ISO 8601 datetime',
      required: true,
    }),
    guestName: Property.ShortText({
      displayName: 'Guest Name',
      description: 'Name of the guest',
      required: false,
    }),
    guestEmail: Property.ShortText({
      displayName: 'Guest Email',
      description: 'Email of the guest',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('appointments/create', {
      leadId: context.propsValue.leadId,
      eventTypeId: context.propsValue.eventTypeId,
      startTime: context.propsValue.startTime,
      guestName: context.propsValue.guestName,
      guestEmail: context.propsValue.guestEmail,
    });
  },
});
