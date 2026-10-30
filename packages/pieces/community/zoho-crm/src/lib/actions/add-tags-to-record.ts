import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { ZohoCrmError, requireApiName, requireId, stringList } from '../common/client';
import { moduleDropdown, recordDropdown, tagsDropdown } from '../common/props';
import { changeTags, ensureTag } from '../common/records';
import { tagChangeOutputSchema } from '../output-schemas';

export const addTagsToRecordAction = createAction({
  auth: zohoCrmAuth,
  name: 'add_tags_to_record',
  classification: 'WRITE',
  displayName: 'Add Tags to Record',
  description: 'Adds existing or new tags to a record. New tag names are created first.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds tags to one Zoho CRM record, creating any tag name that does not exist yet in the module. Existing tags on the record are kept. Idempotent: adding a tag the record already has changes nothing.',
    idempotent: true,
  },
  props: {
    module: moduleDropdown(),
    record_id: recordDropdown(),
    tags: tagsDropdown(),
    new_tags: Property.Array({
      displayName: 'New Tag Names',
      description: 'Tag names to create (if missing) and add.',
      required: false,
    }),
  },
  outputSchema: tagChangeOutputSchema,
  async run({ auth, propsValue }) {
    const module = requireApiName({ value: propsValue.module, name: 'Module' });
    const recordId = requireId({ value: propsValue.record_id, name: 'Record' });
    const existing = stringList(propsValue.tags);
    const created = stringList(propsValue.new_tags);
    const names = [...new Set([...existing, ...created])];
    if (names.length === 0) {
      throw new ZohoCrmError('Choose at least one tag or enter a new tag name.');
    }
    if (names.length > 10) {
      throw new ZohoCrmError('Zoho allows at most 10 tags per record.');
    }
    for (const name of created) {
      await ensureTag({ auth, module, name });
    }
    return changeTags({ auth, module, recordIds: [recordId], tags: names.map((name) => ({ name })), mode: 'add' });
  },
});
