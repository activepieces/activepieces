import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const cancelAppointmentAction = createAction({
  name: 'cancel_appointment',
  displayName: 'Cancel Appointment',
  description: 'Cancels an existing appointment.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    appointmentId: Property.ShortText({
      displayName: 'Appointment ID',
      description: 'The ID of the appointment to cancel',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Cancellation reason',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('appointments/cancel', {
      appointmentId: context.propsValue.appointmentId,
      reason: context.propsValue.reason,
    });
  },
});
