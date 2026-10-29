import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const getBroadcastAction = createAction({
  auth: dripAuth,
  name: 'get_broadcast',
  displayName: 'Get Broadcast',
  description: 'Gets one Single-Email Campaign (broadcast) by ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Drip Single-Email Campaign (broadcast) by ID with name, status, subject, sender, send time and preview URL. Use after List Broadcasts to inspect one; this cannot send it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    id: Property.ShortText({ displayName: 'Broadcast ID', description: 'Single-Email Campaign ID (digits, from List Broadcasts).', required: true }),
  },
  outputSchema: dripOutputSchemas.broadcast,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const id = dripApi.parseNumericId({ value: propsValue.id, label: 'Broadcast ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${dripApi.accountPath(accountId)}/broadcasts/${id}`,
      operation: 'get broadcast',
    });
    return dripApi.firstRecord({ body, key: 'broadcasts', operation: 'get broadcast' });
  },
});
