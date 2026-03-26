import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const dealAmountChanged = createOpplifyTrigger({
  name: 'deal_amount_changed',
  displayName: 'Deal Amount Changed',
  description:
    "Triggers when a deal's monetary value changes.",
  eventType: 'deal_amount_changed',
  props: {},
  sampleData: SAMPLE_DATA.deal_amount_changed,
});
