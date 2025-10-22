import z from 'zod';

export const bookAppointment = {
  workspace_id: z.string().min(1),
  service_id: z.string().min(1),
  staff_id: z.string().optional(),
  resource_id: z.string().optional(),
  group_id: z.string().optional(),
  from_time: z.string(),
  to_time: z.string().optional(),
  timezone: z.string().optional(),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(1),
  notes: z.string().optional(),
  additional_fields: z.record(z.any()).optional(),
  cost_paid: z.number().min(0).optional(),
};

export const rescheduleAppointment = {
  booking_id: z.string().min(1),
  service_id: z.string().optional(),
  staff_id: z.string().optional(),
  group_id: z.string().optional(),
  start_time: z.string().optional(),
};

export const fetchAvailability = {
  workspace_id: z.string().min(1),
  service_id: z.string().min(1),
  staff_id: z.string().optional(),
  group_id: z.string().optional(),
  resource_id: z.string().optional(),
  selected_date: z.string(),
};

export const getAppointmentDetails = {
  booking_id: z.string().min(1),
};

export const cancelAppointment = {
  booking_id: z.string().min(1),
  action: z.enum(['cancel', 'completed', 'noshow']),
};