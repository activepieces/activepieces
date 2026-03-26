import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const appointmentBooked = createOpplifyTrigger({
  name: 'appointment_booked',
  displayName: 'Appointment Booked',
  description:
    'Triggers when a lead books an appointment via the booking page.',
  eventType: 'appointment_booked',
  props: {},
  sampleData: SAMPLE_DATA.appointment_booked,
});
