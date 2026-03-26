import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const conversionTracked = createOpplifyTrigger({
  name: 'conversion_tracked',
  displayName: 'Conversion Tracked',
  description:
    'Triggers when a conversion event is recorded in analytics.',
  eventType: 'conversion_tracked',
  props: {},
  sampleData: SAMPLE_DATA.conversion_tracked,
});
