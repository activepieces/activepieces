import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp, stringList } from '../../ai-common';
import { tagChangeSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export const removeTagsFromRecordAction = createAction({
  auth: vtigerAuth,
  name: 'remove_tags_from_record',
  displayName: 'Remove Tags from Record',
  description: 'Removes tags from one Vtiger record.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one or more tags from a single record only; the tags stay on other records and can be re-added with Add Tags to Record. Removing a tag the record does not have changes nothing.',
    idempotent: true,
  },
  outputSchema: tagChangeSchema,
  props: {
    recordId: recordIdProp(),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tag names to remove from this record.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = assertRecordId({ value: propsValue.recordId });
    const tags = stringList({ value: propsValue.tags, label: 'Tags' });
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.POST,
      path: 'tags_delete',
      form: { id, tags: JSON.stringify(tags), delete_all: 'false' },
    });
    return { recordId: id, tags, message: isRecord(result) && typeof result['message'] === 'string' ? result['message'] : '' };
  },
});
