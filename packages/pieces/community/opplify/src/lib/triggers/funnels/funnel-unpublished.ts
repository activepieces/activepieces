import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const funnelUnpublished = createOpplifyTrigger({
  name: 'funnel_unpublished',
  displayName: 'Funnel Unpublished',
  description:
    'Triggers when a published funnel is taken offline.',
  eventType: 'funnel_unpublished',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.funnel_unpublished,
});
