import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const formSubmitted = createOpplifyTrigger({
  name: 'form_submitted',
  displayName: 'Form Submitted',
  description:
    'Triggers when a form is submitted through a funnel. Filter by funnel to watch a specific one.',
  eventType: 'form_submitted',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.form_submitted,
});
