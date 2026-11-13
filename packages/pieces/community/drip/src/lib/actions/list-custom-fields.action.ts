import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listCustomFieldsAction = createAction({
  auth: dripAuth,
  name: 'list_custom_fields',
  displayName: 'List Custom Fields',
  description: 'Lists the custom field identifiers used in the Drip account.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the custom field identifiers (keys such as shirt_size) used in a Drip account. Use to find the exact key before setting custom fields on a subscriber. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
  },
  outputSchema: dripOutputSchemas.stringList,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<{ custom_field_identifiers?: unknown }>({
      token,
      method: HttpMethod.GET,
      path: `${dripApi.accountPath(accountId)}/custom_field_identifiers`,
      operation: 'list custom fields',
    });
    return { items: Array.isArray(body.custom_field_identifiers) ? body.custom_field_identifiers.map(String) : [] };
  },
});
