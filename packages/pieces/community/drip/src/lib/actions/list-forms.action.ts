import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listFormsAction = createAction({
  auth: dripAuth,
  name: 'list_forms',
  displayName: 'List Forms',
  description: 'Lists the opt-in forms in the Drip account.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every Drip opt-in form in an account with ID, headline, description and whether it shows as a widget or can be embedded. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
  },
  outputSchema: dripOutputSchemas.formList,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({ token, method: HttpMethod.GET, path: `${dripApi.accountPath(accountId)}/forms`, operation: 'list forms' });
    return { items: dripApi.recordList({ body, key: 'forms' }) };
  },
});
