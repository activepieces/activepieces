import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const noteCreated = createOpplifyTrigger({
  name: 'note_created',
  displayName: 'Note Created',
  description:
    "Triggers when a note is added to a lead's timeline.",
  eventType: 'note_created',
  sampleData: SAMPLE_DATA.note_created,
});
