import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const dealClosedWon = createOpplifyTrigger({
  name: 'deal_closed_won',
  displayName: 'Deal Closed Won',
  description:
    'Triggers when a deal is won (closed_won stage).',
  eventType: 'deal_closed_won',
  props: {},
  sampleData: SAMPLE_DATA.deal_closed_won,
});
