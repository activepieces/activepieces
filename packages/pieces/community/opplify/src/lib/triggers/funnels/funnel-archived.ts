import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const funnelArchived = createOpplifyTrigger({
  name: 'funnel_archived',
  displayName: 'Funnel Archived',
  description: 'Triggers when a funnel is archived.',
  eventType: 'funnel_archived',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.funnel_archived,
});
