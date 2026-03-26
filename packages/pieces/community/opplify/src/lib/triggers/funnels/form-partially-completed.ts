import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { formIdDropdown } from '../../common/props';

export const formPartiallyCompleted = createOpplifyTrigger({
  name: 'form_partially_completed',
  displayName: 'Form Partially Completed',
  description:
    "Triggers when a visitor starts a multi-step form but doesn't finish it.",
  eventType: 'form_partial',
  props: {
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.form_partial,
});
