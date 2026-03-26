import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const emailOpened = createOpplifyTrigger({
  name: 'email_opened',
  displayName: 'Email Opened',
  description: 'Triggers when a lead opens an email.',
  eventType: 'email_opened',
  sampleData: SAMPLE_DATA.email_opened,
});
