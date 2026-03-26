import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const smsFailed = createOpplifyTrigger({
  name: 'sms_failed',
  displayName: 'SMS Failed',
  description: 'Triggers when an SMS fails to deliver.',
  eventType: 'sms_failed',
  sampleData: SAMPLE_DATA.sms_failed,
});
