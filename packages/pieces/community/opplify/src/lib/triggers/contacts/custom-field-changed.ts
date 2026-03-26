import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { customFieldDropdown } from '../../common/props';

export const customFieldChanged = createOpplifyTrigger({
  name: 'custom_field_changed',
  displayName: 'Custom Field Changed',
  description:
    'Triggers when any custom field value changes on a lead.',
  eventType: 'custom_field_changed',
  props: {
    fieldName: customFieldDropdown,
  },
  sampleData: SAMPLE_DATA.custom_field_changed,
});
