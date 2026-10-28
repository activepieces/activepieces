import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { freshsalesProps } from '../common/props';
import { appointmentOutputSchema } from '../output-schemas';

export const createAppointment = createAction({
  auth: freshsalesAuth,
  name: 'create_appointment',
  displayName: 'Create Appointment',
  description: 'Schedule an appointment, optionally linked to a record',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Freshsales appointment with a start and end time, optionally linked to a contact, account or deal. Returns the appointment with its ID. Not idempotent: each call creates a new appointment.',
    idempotent: false,
  },
  outputSchema: appointmentOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the appointment',
      placeholder: 'Demo call',
      required: true,
    }),
    from_date: Property.DateTime({
      displayName: 'Start',
      description: 'Start date and time',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'End',
      description: 'End date and time',
      required: true,
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
      placeholder: 'Zoom',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Details of the appointment',
      required: false,
    }),
    is_allday: Property.Checkbox({
      displayName: 'All Day',
      description: 'Whether it lasts all day',
      required: false,
    }),
    targetable_type: freshsalesProps.targetableType({ required: false }),
    targetable_id: freshsalesProps.targetableId({ required: false }),
  },
  async run(context) {
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
    const appointment = freshsalesClient.pickDefined({
      title: context.propsValue.title,
      from_date: fromDate,
      end_date: endDate,
      time_zone: context.propsValue.time_zone,
      location: context.propsValue.location,
      description: context.propsValue.description,
      is_allday: context.propsValue.is_allday,
      targetable_type: targetableType,
      targetable_id: targetableId,
    });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/appointments',
      body: { appointment },
    });
    return freshsalesRecords.shapeTargetable(
      freshsalesClient.unwrap({ body: response, key: 'appointment' })
    );
  },
});
