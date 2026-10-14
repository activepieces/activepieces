import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomListEventTypes } from './list-event-types';
import { calcomGetEventType } from './get-event-type';
import { calcomCreateEventType } from './create-event-type';
import { calcomUpdateEventType } from './update-event-type';
import { calcomDeleteEventType } from './delete-event-type';
import { calcomListBookings } from './list-bookings';
import { calcomGetBooking } from './get-booking';
import { calcomCreateBooking } from './create-booking';
import { calcomCancelBooking } from './cancel-booking';
import { calcomRescheduleBooking } from './reschedule-booking';
import { calcomConfirmBooking } from './confirm-booking';
import { calcomDeclineBooking } from './decline-booking';
import { calcomMarkBookingNoShow } from './mark-booking-no-show';
import { calcomAddAttendee } from './add-attendee';
import { calcomGetAvailableSlots } from './get-available-slots';
import { calcomListSchedules } from './list-schedules';
import { calcomGetSchedule } from './get-schedule';
import { calcomCreateSchedule } from './create-schedule';
import { calcomUpdateSchedule } from './update-schedule';
import { calcomDeleteSchedule } from './delete-schedule';
import { calcomGetDefaultSchedule } from './get-default-schedule';
import { calcomListTimezones } from './list-timezones';
import { calcomGetMyProfile } from './get-my-profile';
import { calcomUpdateMyProfile } from './update-my-profile';
import { calcomListTeams } from './list-teams';

export const actions = [
  calcomListEventTypes,
  calcomGetEventType,
  calcomCreateEventType,
  calcomUpdateEventType,
  calcomDeleteEventType,
  calcomListBookings,
  calcomGetBooking,
  calcomCreateBooking,
  calcomCancelBooking,
  calcomRescheduleBooking,
  calcomConfirmBooking,
  calcomDeclineBooking,
  calcomMarkBookingNoShow,
  calcomAddAttendee,
  calcomGetAvailableSlots,
  calcomListSchedules,
  calcomGetSchedule,
  calcomCreateSchedule,
  calcomUpdateSchedule,
  calcomDeleteSchedule,
  calcomGetDefaultSchedule,
  calcomListTimezones,
  calcomGetMyProfile,
  calcomUpdateMyProfile,
  calcomListTeams,
  createCustomApiCallAction({
    baseUrl: () => 'https://api.cal.com/v2',
    auth: calcomAuth,
    authMapping: async (auth) => ({
      Authorization: `Bearer ${auth.secret_text}`,
    }),
  }),
];
