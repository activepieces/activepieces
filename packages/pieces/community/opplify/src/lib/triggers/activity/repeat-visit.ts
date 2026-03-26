import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const repeatVisit = createOpplifyTrigger({
  name: 'repeat_visit',
  displayName: 'Repeat Visit',
  description:
    'Triggers when a known visitor returns to a funnel page.',
  eventType: 'repeat_visit',
  props: {},
  sampleData: SAMPLE_DATA.repeat_visit,
});
