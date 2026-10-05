import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { deletedOutputSchema } from '../../output-schemas';

export const flowluAccountDelete = createAction({
  auth: flowluAuth,
  name: 'flowlu_account_delete',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete CRM Account',
  description: 'Deletes a CRM contact or organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Flowlu CRM account (contact or organization) by its numeric account_id. Use only when the record must be removed. Not idempotent: a second call fails because the account no longer exists.',
    idempotent: false,
  },
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Numeric ID of the contact or organization to delete, such as "42".',
      required: true,
    }),
  },
  outputSchema: deletedOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.account_id,
      name: 'Account ID',
    });
    const res = await makeClient(context.auth).deleteRecord(
      'crm',
      'account',
      id
    );
    return { id: Number(res.id ?? id), deleted: true };
  },
});
