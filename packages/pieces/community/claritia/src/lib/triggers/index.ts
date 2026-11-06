import { hookTrigger } from './hook-trigger';

export const newFill = hookTrigger({ name: 'new_fill', displayName: 'New Fill', description: 'Triggers when someone fills in a form.', event: 'form.submitted', forms: true });
export const newBooking = hookTrigger({ name: 'new_booking', displayName: 'New Booking', description: 'Triggers when someone books a meeting.', event: 'meeting.booked' });
export const bookingCanceled = hookTrigger({ name: 'booking_canceled', displayName: 'Booking Canceled', description: 'Triggers when a meeting is canceled.', event: 'meeting.canceled' });
export const leadRouted = hookTrigger({ name: 'lead_routed', displayName: 'Lead Routed', description: 'Triggers when routing gives a lead an owner, or finds none.', event: 'lead.routed' });
