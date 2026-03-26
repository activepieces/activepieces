import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { statusDropdown } from '../../common/props';

export const leadStatusChanged = createOpplifyTrigger({
  name: 'lead_status_changed',
  displayName: 'Lead Status Changed',
  description:
    "Triggers when a lead's status changes (e.g., new to contacted, qualified to converted).",
  eventType: 'status_changed',
  props: {
    newStatus: statusDropdown,
  },
  sampleData: SAMPLE_DATA.status_changed,
});
