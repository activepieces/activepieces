import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const funnelPublished = createOpplifyTrigger({
  name: 'funnel_published',
  displayName: 'Funnel Published',
  description: 'Triggers when a funnel is published and goes live.',
  eventType: 'funnel_published',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.funnel_published,
});
