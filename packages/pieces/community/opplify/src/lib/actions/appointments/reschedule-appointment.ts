import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const rescheduleAppointmentAction = createAction({
  name: 'reschedule_appointment',
  displayName: 'Reschedule Appointment',
  description: 'Reschedules an appointment to a new time.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    appointmentId: Property.ShortText({
      displayName: 'Appointment ID',
      description: 'The ID of the appointment to reschedule',
      required: true,
    }),
    newStartTime: Property.ShortText({
      displayName: 'New Start Time',
      description: 'New ISO 8601 datetime',
      required: true,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('appointments/reschedule', {
      appointmentId: context.propsValue.appointmentId,
      newStartTime: context.propsValue.newStartTime,
    });
  },
});
