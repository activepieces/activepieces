import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { tagFilterDropdown } from '../../common/props';

export const tagRemoved = createOpplifyTrigger({
  name: 'tag_removed',
  displayName: 'Tag Removed',
  description: 'Triggers when a tag is removed from a lead.',
  eventType: 'tag_removed',
  props: {
    tagName: tagFilterDropdown,
  },
  sampleData: SAMPLE_DATA.tag_removed,
});
