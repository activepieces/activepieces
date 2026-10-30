import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { deleteOutputSchema } from '../output-schemas';

export const deleteAppointment = createAction({
  auth: freshsalesAuth,
  name: 'delete_appointment',
  displayName: 'Delete Appointment',
  description: 'Delete a appointment by its ID',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Freshsales appointment by numeric ID. A second call for the same ID fails with a not-found error. Confirm the ID with Get Appointment first.',
    idempotent: true,
  },
  outputSchema: deleteOutputSchema,
  props: {
    appointment_id: Property.ShortText({
      displayName: 'Appointment ID',
      description: 'ID of the appointment to delete',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({
      value: context.propsValue.appointment_id,
      field: 'Appointment ID',
    });
    await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/api/appointments/${id}`,
    });
    return { id, deleted: true };
  },
});
