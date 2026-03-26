import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const appointmentCompleted = createOpplifyTrigger({
  name: 'appointment_completed',
  displayName: 'Appointment Completed',
  description:
    'Triggers when an appointment is marked as completed.',
  eventType: 'appointment_completed',
  props: {},
  sampleData: SAMPLE_DATA.appointment_completed,
});
