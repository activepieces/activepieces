import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { formIdDropdown } from '../../common/props';

export const formViewed = createOpplifyTrigger({
  name: 'form_viewed',
  displayName: 'Form Viewed',
  description: 'Triggers when a form is viewed on a page.',
  eventType: 'form_viewed',
  props: {
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.form_viewed,
});
