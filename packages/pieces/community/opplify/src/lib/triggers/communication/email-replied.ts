import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const emailReplied = createOpplifyTrigger({
  name: 'email_replied',
  displayName: 'Email Replied',
  description: 'Triggers when a lead replies to an email.',
  eventType: 'email_replied',
  sampleData: SAMPLE_DATA.email_replied,
});
