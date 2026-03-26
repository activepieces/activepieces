import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const conversionEvent = createOpplifyTrigger({
  name: 'conversion_event',
  displayName: 'Conversion Event',
  description:
    'Triggers when a conversion event is tracked on a funnel (e.g., form submit, signup, purchase).',
  eventType: 'conversion',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.conversion,
});
