import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { lifecycleDropdown } from '../../common/props';

export const leadLifecycleChanged = createOpplifyTrigger({
  name: 'lead_lifecycle_changed',
  displayName: 'Lead Lifecycle Changed',
  description:
    "Triggers when a lead's lifecycle stage changes (e.g., lead to MQL, SQL to customer).",
  eventType: 'lifecycle_changed',
  props: {
    newStage: lifecycleDropdown,
  },
  sampleData: SAMPLE_DATA.lifecycle_changed,
});
