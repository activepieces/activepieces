import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const markAppointmentCompletedAction = createAction({
  name: 'mark_appointment_completed',
  displayName: 'Mark Appointment Completed',
  description: 'Marks an appointment as completed after the meeting has taken place.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    appointmentId: Property.ShortText({
      displayName: 'Appointment ID',
      description: 'The ID of the appointment to mark as completed',
      required: true,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('appointments/mark-completed', {
      appointmentId: context.propsValue.appointmentId,
    });
  },
});
