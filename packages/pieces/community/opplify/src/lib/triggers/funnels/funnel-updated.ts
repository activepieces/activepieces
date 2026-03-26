import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const funnelUpdated = createOpplifyTrigger({
  name: 'funnel_updated',
  displayName: 'Funnel Updated',
  description:
    "Triggers when a funnel's pages are updated and a new version is created.",
  eventType: 'funnel_updated',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.funnel_updated,
});
