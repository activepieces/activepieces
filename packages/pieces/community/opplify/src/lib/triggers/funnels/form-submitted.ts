import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { formIdDropdown } from '../../common/props';

export const formSubmitted = createOpplifyTrigger({
  name: 'form_submitted',
  displayName: 'Form Submitted',
  description:
    'Triggers when a specific form is submitted. Use this for standalone forms or when you know exactly which form to watch.',
  eventType: 'form_submitted',
  props: {
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.form_submitted,
});
