import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const emailUnsubscribed = createOpplifyTrigger({
  name: 'email_unsubscribed',
  displayName: 'Email Unsubscribed',
  description: 'Triggers when a lead unsubscribes from emails.',
  eventType: 'email_unsubscribed',
  sampleData: SAMPLE_DATA.email_unsubscribed,
});
