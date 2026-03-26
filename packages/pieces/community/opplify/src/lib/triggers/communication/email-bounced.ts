import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const emailBounced = createOpplifyTrigger({
  name: 'email_bounced',
  displayName: 'Email Bounced',
  description:
    'Triggers when an email bounces (hard or soft bounce).',
  eventType: 'email_bounced',
  sampleData: SAMPLE_DATA.email_bounced,
});
