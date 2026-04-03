import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown, funnelActionDropdown } from '../../common/props';

export const funnelActivity = createOpplifyTrigger({
  name: 'funnel_activity',
  displayName: 'Funnel Activity',
  description:
    'Triggers on funnel lifecycle events: published, unpublished, archived, page updated, or version restored.',
  eventType: 'funnel_activity',
  props: {
    funnelId: funnelIdDropdown,
    action: funnelActionDropdown,
  },
  sampleData: SAMPLE_DATA.funnel_activity,
});
