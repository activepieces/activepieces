import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const getFormAction = createAction({
  auth: dripAuth,
  name: 'get_form',
  displayName: 'Get Form',
  description: 'Gets one opt-in form by ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Drip opt-in form by Form ID with its headline, description, button text and display settings. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    id: Property.ShortText({ displayName: 'Form ID', description: 'Form ID (digits, from List Forms).', required: true }),
  },
  outputSchema: dripOutputSchemas.form,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const id = dripApi.parseNumericId({ value: propsValue.id, label: 'Form ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${dripApi.accountPath(accountId)}/forms/${id}`,
      operation: 'get form',
    });
    return dripApi.firstRecord({ body, key: 'forms', operation: 'get form' });
  },
});
