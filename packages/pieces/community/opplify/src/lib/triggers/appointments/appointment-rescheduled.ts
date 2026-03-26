import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const appointmentRescheduled = createOpplifyTrigger({
  name: 'appointment_rescheduled',
  displayName: 'Appointment Rescheduled',
  description:
    'Triggers when an appointment is rescheduled to a new time.',
  eventType: 'appointment_rescheduled',
  props: {},
  sampleData: SAMPLE_DATA.appointment_rescheduled,
});
