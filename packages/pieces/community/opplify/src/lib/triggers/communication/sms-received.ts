import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const smsReceived = createOpplifyTrigger({
  name: 'sms_received',
  displayName: 'SMS Received',
  description: 'Triggers when an inbound SMS is received from a lead.',
  eventType: 'sms_received',
  sampleData: SAMPLE_DATA.sms_received,
});
