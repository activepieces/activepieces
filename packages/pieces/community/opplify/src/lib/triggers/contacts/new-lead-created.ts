import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { leadSourceDropdown } from '../../common/props';

export const newLeadCreated = createOpplifyTrigger({
  name: 'new_lead_created',
  displayName: 'New Lead Created',
  description:
    'Triggers when a new lead is created — via form submission, manual creation, import, or API.',
  eventType: 'lead_created',
  props: {
    source: leadSourceDropdown,
  },
  sampleData: SAMPLE_DATA.lead_created,
});
