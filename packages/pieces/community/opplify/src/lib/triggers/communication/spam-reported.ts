import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const spamReported = createOpplifyTrigger({
  name: 'spam_reported',
  displayName: 'Spam Reported',
  description:
    'Triggers when a lead marks an email as spam.',
  eventType: 'spam_reported',
  sampleData: SAMPLE_DATA.spam_reported,
});
