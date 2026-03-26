import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const emailReceived = createOpplifyTrigger({
  name: 'email_received',
  displayName: 'Email Received',
  description: 'Triggers when an inbound email is received from a lead.',
  eventType: 'email_received',
  sampleData: SAMPLE_DATA.email_received,
});
