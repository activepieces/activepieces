import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const smsDelivered = createOpplifyTrigger({
  name: 'sms_delivered',
  displayName: 'SMS Delivered',
  description:
    'Triggers when an SMS is successfully delivered.',
  eventType: 'sms_delivered',
  sampleData: SAMPLE_DATA.sms_delivered,
});
