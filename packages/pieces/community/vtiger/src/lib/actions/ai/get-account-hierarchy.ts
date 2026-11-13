import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp } from '../../ai-common';
import { accountHierarchySchema } from '../../output-schemas';
import { vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export const getAccountHierarchyAction = createAction({
  auth: vtigerAuth,
  name: 'get_account_hierarchy',
  displayName: 'Get Account Hierarchy',
  description: 'Returns the parent and child accounts of an Organization.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the account hierarchy (parent and member organizations) around one Accounts (Organizations) record. Only works with Accounts IDs.',
    idempotent: true,
  },
  outputSchema: accountHierarchySchema,
  props: {
    accountId: recordIdProp({
      displayName: 'Account ID',
      description: 'Webservice ID of an Accounts (Organizations) record, for example 11x42.',
    }),
  },
  async run({ auth, propsValue }) {
    const id = assertRecordId({ value: propsValue.accountId, label: 'Account ID' });
    const hierarchy = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'get_account_hierarchy',
      query: { id },
    });
    return { accountId: id, hierarchy };
  },
});
