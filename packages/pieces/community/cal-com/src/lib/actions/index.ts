import { createBooking } from './create-booking';
import { getBookings } from './get-bookings';
import { getBooking } from './get-booking';
import { cancelBooking } from './cancel-booking';
import { rescheduleBooking } from './reschedule-booking';
import { getAvailableSlots } from './get-available-slots';
import { getEventTypes } from './get-event-types';

export const actions = [
  createBooking,
  getBookings,
  getBooking,
  cancelBooking,
  rescheduleBooking,
  getAvailableSlots,
  getEventTypes,
];
