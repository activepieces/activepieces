import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp } from '../../ai-common';
import { unlinkResultSchema } from '../../output-schemas';
import { vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export const unlinkRecordsAction = createAction({
  auth: vtigerAuth,
  name: 'unlink_records',
  displayName: 'Unlink Records',
  description: 'Removes a record from a related list of another record. Both records stay.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes the link between two records (e.g. takes a Contact off an Account) without deleting either record; Link Records restores it. Unlinking a pair that is not linked succeeds and changes nothing.',
    idempotent: true,
  },
  outputSchema: unlinkResultSchema,
  props: {
    sourceRecordId: recordIdProp({ displayName: 'Source Record ID', description: 'Webservice ID of the parent record.' }),
    relatedRecordId: recordIdProp({ displayName: 'Related Record ID', description: 'Webservice ID of the linked record.' }),
  },
  async run({ auth, propsValue }) {
    const sourceRecordId = assertRecordId({ value: propsValue.sourceRecordId, label: 'Source Record ID' });
    const relatedRecordId = assertRecordId({ value: propsValue.relatedRecordId, label: 'Related Record ID' });
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.POST,
      path: 'delete_related',
      form: { sourceRecordId, relatedRecordId },
    });
    return { sourceRecordId, relatedRecordId, unlinked: true, result };
  },
});
