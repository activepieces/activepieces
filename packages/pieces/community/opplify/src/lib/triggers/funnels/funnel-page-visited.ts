import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const funnelPageVisited = createOpplifyTrigger({
  name: 'funnel_page_visited',
  displayName: 'Funnel Page Visited',
  description:
    'Triggers when a visitor views a page on a published funnel.',
  eventType: 'page_visited',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.page_visited,
});
