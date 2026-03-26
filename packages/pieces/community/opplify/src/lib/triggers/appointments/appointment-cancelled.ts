import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const appointmentCancelled = createOpplifyTrigger({
  name: 'appointment_cancelled',
  displayName: 'Appointment Cancelled',
  description: 'Triggers when an appointment is cancelled.',
  eventType: 'appointment_cancelled',
  props: {},
  sampleData: SAMPLE_DATA.appointment_cancelled,
});
