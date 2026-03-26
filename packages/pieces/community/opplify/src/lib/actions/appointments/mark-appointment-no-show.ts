import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const markAppointmentNoShowAction = createAction({
  name: 'mark_appointment_no_show',
  displayName: 'Mark Appointment No Show',
  description: 'Marks an appointment as a no-show when the lead doesn\'t attend.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    appointmentId: Property.ShortText({
      displayName: 'Appointment ID',
      description: 'The ID of the appointment to mark as no-show',
      required: true,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('appointments/mark-no-show', {
      appointmentId: context.propsValue.appointmentId,
    });
  },
});
