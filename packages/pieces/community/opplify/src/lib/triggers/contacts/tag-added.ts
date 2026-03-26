import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { tagFilterDropdown } from '../../common/props';

export const tagAdded = createOpplifyTrigger({
  name: 'tag_added',
  displayName: 'Tag Added',
  description:
    'Triggers when a tag is added to a lead — by rules, manual action, or workflow.',
  eventType: 'tag_added',
  props: {
    tagName: tagFilterDropdown,
  },
  sampleData: SAMPLE_DATA.tag_added,
});
