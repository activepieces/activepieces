import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const emailSent = createOpplifyTrigger({
  name: 'email_sent',
  displayName: 'Email Sent',
  description: 'Triggers when an email is sent to a lead.',
  eventType: 'email_sent',
  sampleData: SAMPLE_DATA.email_sent,
});
