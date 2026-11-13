import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoBookingsAuth } from '../auth';
import { zohoBookingsApi } from '../common/api';
import { zohoBookingsProps } from '../common/props';
import { bookAppointmentOutputSchema } from '../output-schemas';

export const bookAppointmentAction = createAction({
  auth: zohoBookingsAuth,
  name: 'bookAppointment',
  outputSchema: bookAppointmentOutputSchema,
  classification: 'WRITE',
  displayName: 'Book Appointment',
  description: 'Book an appointment for a customer for a desired service',
  audience: 'human',
  aiMetadata: {
    description:
      'Create a new appointment in a Zoho Bookings workspace for a given service, customer (name/email/phone), and start time. Assign the booking to exactly one of staff, resource, or group (the call fails if none is supplied). Not idempotent: each call books a separate appointment.',
    idempotent: false,
  },
  props: {
    workspace_id: zohoBookingsProps.workspaceId({
      required: true,
      description: 'Select the workspace for the appointment',
    }),
    service_id: zohoBookingsProps.serviceId({
      required: true,
      description: 'Select the service for which the appointment is booked',
    }),
    staff_id: zohoBookingsProps.staffId({
      required: false,
      description: 'Select the staff member (use this OR resource_id OR group_id)',
    }),
    resource_id: zohoBookingsProps.resourceId({ required: false }),
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description:
        'The unique ID of the staff group for collective booking (use this OR staff_id OR resource_id)',
      required: false,
    }),
    from_time: Property.DateTime({
      displayName: 'From Time',
      description:
        'The starting time for the appointment (format: mm-dd-yyyy HH:mm:ss)',
      required: true,
    }),
    to_time: Property.DateTime({
      displayName: 'To Time',
      description:
        'End time for resource booking (optional, format: dd-MMM-yyyy HH:mm:ss)',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'The timezone for the appointment (optional)',
      required: false,
    }),
    customer_name: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Name of the customer',
      required: true,
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Email address of the customer',
      required: true,
    }),
    customer_phone: Property.ShortText({
      displayName: 'Customer Phone',
      description: 'Phone number of the customer',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional information about the appointment (optional)',
      required: false,
    }),
    additional_fields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Additional customer details as JSON object (optional)',
      required: false,
    }),
    cost_paid: Property.Number({
      displayName: 'Cost Paid',
      description: 'Amount paid for the booking (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    await propsValidation.validateZod(propsValue, schema);

    if (!propsValue.staff_id && !propsValue.resource_id && !propsValue.group_id) {
      throw new Error('Either staff_id, resource_id, or group_id must be provided');
    }

    return await zohoBookingsApi.bookAppointment({
      auth,
      serviceId: propsValue.service_id,
      fromTime: propsValue.from_time,
      customerName: propsValue.customer_name,
      customerEmail: propsValue.customer_email,
      customerPhone: propsValue.customer_phone,
      staffId: propsValue.staff_id,
      resourceId: propsValue.resource_id,
      groupId: propsValue.group_id,
      toTime: propsValue.to_time,
      timezone: propsValue.timezone,
      notes: propsValue.notes,
      additionalFields: propsValue.additional_fields,
      costPaid: propsValue.cost_paid,
    });
  },
});

const schema = {
  workspace_id: z.string().check(z.minLength(1)),
  service_id: z.string().check(z.minLength(1)),
  staff_id: z.optional(z.string()),
  resource_id: z.optional(z.string()),
  group_id: z.optional(z.string()),
  from_time: z.string(),
  to_time: z.optional(z.string()),
  timezone: z.optional(z.string()),
  customer_name: z.string().check(z.minLength(1)),
  customer_email: z.string().check(z.email()),
  customer_phone: z.string().check(z.minLength(1)),
  notes: z.optional(z.string()),
  additional_fields: z.optional(z.record(z.string(), z.unknown())),
  cost_paid: z.optional(z.number().check(z.minimum(0))),
};
