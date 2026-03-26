import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const dealAssigned = createOpplifyTrigger({
  name: 'deal_assigned',
  displayName: 'Deal Assigned',
  description:
    'Triggers when a deal is assigned to a team member.',
  eventType: 'deal_assigned',
  props: {},
  sampleData: SAMPLE_DATA.deal_assigned,
});
