import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const emailDelivered = createOpplifyTrigger({
  name: 'email_delivered',
  displayName: 'Email Delivered',
  description:
    "Triggers when an email is successfully delivered to a lead's inbox.",
  eventType: 'email_delivered',
  sampleData: SAMPLE_DATA.email_delivered,
});
