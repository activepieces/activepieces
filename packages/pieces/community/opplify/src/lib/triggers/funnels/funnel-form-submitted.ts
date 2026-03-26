import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const funnelFormSubmitted = createOpplifyTrigger({
  name: 'funnel_form_submitted',
  displayName: 'Funnel Form Submitted',
  description:
    'Triggers when any form within a specific funnel is submitted. Use this to capture all submissions from a funnel regardless of which form.',
  eventType: 'form_submitted',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.form_submitted,
});
