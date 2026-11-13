import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordOutputSchema } from '../../output-schemas';

export const patchRecordAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_patch_record',
  outputSchema: surrealdbRecordOutputSchema,
  displayName: 'Patch Record',
  description: 'Applies JSON Patch operations to an existing record.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Applies a JSON Patch (RFC 6902) array to an existing record: add, remove, replace, move, copy or test, with paths like "/tags/0". Use it to remove fields or edit arrays; Merge Record is simpler for setting fields. Fails when the record does not exist. Not idempotent for array appends.',
    idempotent: false,
  },
  props: {
    recordId: surrealdbAiProps.recordId({ required: true }),
    patches: Property.Json({
      displayName: 'Patches',
      description: 'JSON Patch array, e.g. [{"op": "replace", "path": "/age", "value": 34}, {"op": "remove", "path": "/nickname"}, {"op": "add", "path": "/tags/-", "value": "new"}].',
      required: true,
    }),
  },
  async run(context) {
    const { recordId, patches } = context.propsValue;
    if (!Array.isArray(patches) || patches.length === 0) {
      throw new Error('Patches must be a non-empty JSON array of patch operations.');
    }
    const records = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: 'UPDATE type::record($recordId) PATCH $patches;',
      vars: { recordId, patches },
    });
    return surrealdbUtils.singleRecord({ records, recordId });
  },
});
