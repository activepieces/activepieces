import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const appointmentNoShow = createOpplifyTrigger({
  name: 'appointment_no_show',
  displayName: 'Appointment No Show',
  description:
    "Triggers when a lead doesn't show up for a scheduled appointment.",
  eventType: 'appointment_no_show',
  props: {},
  sampleData: SAMPLE_DATA.appointment_no_show,
});
