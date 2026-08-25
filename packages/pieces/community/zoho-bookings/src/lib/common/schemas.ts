import * as z from 'zod/mini'

export const bookAppointment = {
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

export const rescheduleAppointment = {
  booking_id: z.string().check(z.minLength(1)),
  service_id: z.optional(z.string()),
  staff_id: z.optional(z.string()),
  group_id: z.optional(z.string()),
  start_time: z.optional(z.string()),
};

export const fetchAvailability = {
  workspace_id: z.string().check(z.minLength(1)),
  service_id: z.string().check(z.minLength(1)),
  staff_id: z.optional(z.string()),
  group_id: z.optional(z.string()),
  resource_id: z.optional(z.string()),
  selected_date: z.string(),
};

export const getAppointmentDetails = {
  booking_id: z.string().check(z.minLength(1)),
};

export const cancelAppointment = {
  booking_id: z.string().check(z.minLength(1)),
  action: z.enum(['cancel', 'completed', 'noshow']),
};