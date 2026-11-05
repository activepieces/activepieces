import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { freshsalesProps } from '../common/props';
import { appointmentOutputSchema } from '../output-schemas';

export const updateAppointment = createAction({
  auth: freshsalesAuth,
  name: 'update_appointment',
  displayName: 'Update Appointment',
  description: 'Change an existing appointment',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an existing Freshsales appointment by numeric ID (reschedule, rename, move, relink). Only the fields you provide are changed. Idempotent: repeating the call with the same values gives the same result.',
    idempotent: true,
  },
  outputSchema: appointmentOutputSchema,
  props: {
    appointment_id: Property.ShortText({
      displayName: 'Appointment ID',
      description: 'ID of the appointment to update',
      placeholder: '16000123456',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title of the appointment',
      required: false,
    }),
    from_date: Property.DateTime({
      displayName: 'Start',
      description: 'New start date and time',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End',
      description: 'New end date and time',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'Time zone of the appointment',
      placeholder: 'Eastern Time (US & Canada)',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Where it takes place',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New details of the appointment',
      required: false,
    }),
    is_allday: Property.StaticDropdown({
      displayName: 'All Day',
      description: 'Whether it lasts all day; leave empty to keep',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    targetable_type: freshsalesProps.targetableType({ required: false }),
    targetable_id: freshsalesProps.targetableId({ required: false }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({
      value: context.propsValue.appointment_id,
      field: 'Appointment ID',
    });
    const fromDate = freshsalesClient.toIsoDate(context.propsValue.from_date);
    const endDate = freshsalesClient.toIsoDate(context.propsValue.end_date);
    if (fromDate && endDate && endDate < fromDate) {
      throw new Error('End must be after Start.');
    }
    const targetableId = freshsalesClient.toId({
      value: context.propsValue.targetable_id,
      field: 'Related Record ID',
    });
    const targetableType = context.propsValue.targetable_type;
    if ((targetableId === undefined) !== (targetableType === undefined || targetableType === null)) {
      throw new Error('Provide both Related To and Related Record ID, or neither.');
    }
    const allDay = context.propsValue.is_allday;
    const appointment = freshsalesClient.pickDefined({
      title: context.propsValue.title,
      from_date: fromDate,
      end_date: endDate,
      time_zone: context.propsValue.time_zone,
      location: context.propsValue.location,
      description: context.propsValue.description,
      is_allday: allDay === 'true' ? true : allDay === 'false' ? false : undefined,
      targetable_type: targetableType,
      targetable_id: targetableId,
    });
    if (Object.keys(appointment).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/api/appointments/${id}`,
      body: { appointment },
    });
    return freshsalesRecords.shapeTargetable(
      freshsalesClient.unwrap({ body: response, key: 'appointment' })
    );
  },
});
