import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp } from '../../ai-common';
import { recordTagsSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export function tagNames(result: unknown): string[] {
  const list = Array.isArray(result)
    ? result
    : isRecord(result) && Array.isArray(result['tags'])
    ? result['tags']
    : [];
  return list.flatMap((tag): string[] => {
    if (typeof tag === 'string') {
      return [tag];
    }
    if (isRecord(tag)) {
      const name = tag['tag'] ?? tag['name'];
      return typeof name === 'string' ? [name] : [];
    }
    return [];
  });
}

export const getRecordTagsAction = createAction({
  auth: vtigerAuth,
  name: 'get_record_tags',
  displayName: 'Get Record Tags',
  description: 'Lists the tags on a Vtiger record.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the tags attached to one Vtiger record. Use it to check tags before adding or removing them.',
    idempotent: true,
  },
  outputSchema: recordTagsSchema,
  props: {
    recordId: recordIdProp(),
  },
  async run({ auth, propsValue }) {
    const id = assertRecordId({ value: propsValue.recordId });
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'tags_retrieve',
      query: { id },
    });
    const tags = tagNames(result);
    return { recordId: id, tags, count: tags.length };
  },
});
