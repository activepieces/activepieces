import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp, stringList } from '../../ai-common';
import { tagChangeSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export const addTagsToRecordAction = createAction({
  auth: vtigerAuth,
  name: 'add_tags_to_record',
  displayName: 'Add Tags to Record',
  description: 'Adds tags to a Vtiger record.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one or more tags to a record; tags that do not exist yet are created. Adding a tag the record already has changes nothing.',
    idempotent: true,
  },
  outputSchema: tagChangeSchema,
  props: {
    recordId: recordIdProp(),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tag names to add.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = assertRecordId({ value: propsValue.recordId });
    const tags = stringList({ value: propsValue.tags, label: 'Tags' });
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.POST,
      path: 'tags_add',
      form: { id, tags: JSON.stringify(tags) },
    });
    return { recordId: id, tags, message: isRecord(result) && typeof result['message'] === 'string' ? result['message'] : '' };
  },
});
