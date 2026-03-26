import { Property } from '@activepieces/pieces-framework';
import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const leadDndChanged = createOpplifyTrigger({
  name: 'lead_dnd_changed',
  displayName: 'Lead DND Changed',
  description:
    "Triggers when a lead's Do Not Disturb settings change.",
  eventType: 'dnd_changed',
  props: {
    dndEnabled: Property.StaticDropdown({
      displayName: 'DND Status',
      description: 'Only trigger when DND is turned on or off (optional)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Turned ON', value: 'true' },
          { label: 'Turned OFF', value: 'false' },
        ],
      },
    }),
  },
  sampleData: SAMPLE_DATA.dnd_changed,
});
