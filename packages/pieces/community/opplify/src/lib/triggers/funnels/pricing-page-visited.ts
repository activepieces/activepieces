import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const pricingPageVisited = createOpplifyTrigger({
  name: 'pricing_page_visited',
  displayName: 'Pricing Page Visited',
  description:
    'Triggers when a visitor views the pricing page on a funnel.',
  eventType: 'pricing_page_visited',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.pricing_page_visited,
});
