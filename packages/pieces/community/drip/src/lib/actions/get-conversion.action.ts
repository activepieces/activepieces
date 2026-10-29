import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const getConversionAction = createAction({
  auth: dripAuth,
  name: 'get_conversion',
  displayName: 'Get Conversion',
  description: 'Gets one conversion goal by ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Drip conversion (goal) by ID with name, status, URL, default value in cents and counting method. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    id: Property.ShortText({ displayName: 'Conversion ID', description: 'Conversion ID (digits, from List Conversions).', required: true }),
  },
  outputSchema: dripOutputSchemas.conversion,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const id = dripApi.parseNumericId({ value: propsValue.id, label: 'Conversion ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${dripApi.accountPath(accountId)}/goals/${id}`,
      operation: 'get conversion',
    });
    return dripApi.firstRecord({ body, key: 'goals', operation: 'get conversion' });
  },
});
