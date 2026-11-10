import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { appointmentOutputSchema } from '../output-schemas';

export const getAppointment = createAction({
  auth: freshsalesAuth,
  name: 'get_appointment',
  displayName: 'Get Appointment',
  description: 'Get an appointment by its ID',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Freshsales appointment by numeric ID, including title, start and end times, location and the linked record. Fails with a not-found error if the ID does not exist.',
    idempotent: true,
  },
  outputSchema: appointmentOutputSchema,
  props: {
    appointment_id: Property.ShortText({
      displayName: 'Appointment ID',
      description: 'ID of the appointment to fetch',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({
      value: context.propsValue.appointment_id,
      field: 'Appointment ID',
    });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/appointments/${id}`,
    });
    return freshsalesRecords.shapeTargetable(
      freshsalesClient.unwrap({ body: response, key: 'appointment' })
    );
  },
});
