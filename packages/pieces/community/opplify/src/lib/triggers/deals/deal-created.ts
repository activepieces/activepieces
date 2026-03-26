import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const dealCreated = createOpplifyTrigger({
  name: 'deal_created',
  displayName: 'Deal Created',
  description:
    'Triggers when a new deal is created in the pipeline.',
  eventType: 'deal_created',
  props: {},
  sampleData: SAMPLE_DATA.deal_created,
});
