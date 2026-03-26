import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const funnelCreated = createOpplifyTrigger({
  name: 'funnel_created',
  displayName: 'Funnel Created',
  description: 'Triggers when a new funnel is created.',
  eventType: 'funnel_created',
  props: {},
  sampleData: SAMPLE_DATA.funnel_created,
});
