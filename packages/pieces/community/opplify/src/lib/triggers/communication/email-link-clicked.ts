import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const emailLinkClicked = createOpplifyTrigger({
  name: 'email_link_clicked',
  displayName: 'Email Link Clicked',
  description: 'Triggers when a lead clicks a link in an email.',
  eventType: 'email_clicked',
  sampleData: SAMPLE_DATA.email_clicked,
});
