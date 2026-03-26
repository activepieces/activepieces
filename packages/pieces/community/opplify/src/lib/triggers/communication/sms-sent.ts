import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const smsSent = createOpplifyTrigger({
  name: 'sms_sent',
  displayName: 'SMS Sent',
  description: 'Triggers when an SMS is sent to a lead.',
  eventType: 'sms_sent',
  sampleData: SAMPLE_DATA.sms_sent,
});
