import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { funnelIdDropdown } from '../../common/props';

export const funnelVersionRestored = createOpplifyTrigger({
  name: 'funnel_version_restored',
  displayName: 'Funnel Version Restored',
  description:
    'Triggers when a funnel is restored to a previous version.',
  eventType: 'funnel_version_restored',
  props: {
    funnelId: funnelIdDropdown,
  },
  sampleData: SAMPLE_DATA.funnel_version_restored,
});
