import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const dealClosedLost = createOpplifyTrigger({
  name: 'deal_closed_lost',
  displayName: 'Deal Closed Lost',
  description:
    'Triggers when a deal is lost (closed_lost stage).',
  eventType: 'deal_closed_lost',
  props: {},
  sampleData: SAMPLE_DATA.deal_closed_lost,
});
