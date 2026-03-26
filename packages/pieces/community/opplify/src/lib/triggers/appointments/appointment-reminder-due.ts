import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const appointmentReminderDue = createOpplifyTrigger({
  name: 'appointment_reminder_due',
  displayName: 'Appointment Reminder Due',
  description:
    'Triggers when an appointment reminder time is reached.',
  eventType: 'appointment_reminder',
  props: {},
  sampleData: SAMPLE_DATA.appointment_reminder,
});
