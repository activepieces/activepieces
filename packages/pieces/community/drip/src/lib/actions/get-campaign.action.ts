import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const getCampaignAction = createAction({
  auth: dripAuth,
  name: 'get_campaign',
  displayName: 'Get Email Series',
  description: 'Gets one Email Series Campaign by ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Drip Email Series Campaign by Campaign ID: name, status, sender, sending schedule, double opt-in setting, email count and subscriber counts. Use after List Email Series to inspect a sequence. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    id: Property.ShortText({ displayName: 'Campaign ID', description: 'Email Series Campaign ID (digits, from List Email Series).', required: true }),
  },
  outputSchema: dripOutputSchemas.campaign,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const id = dripApi.parseNumericId({ value: propsValue.id, label: 'Campaign ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${dripApi.accountPath(accountId)}/campaigns/${id}`,
      operation: 'get email series',
    });
    return dripApi.firstRecord({ body, key: 'campaigns', operation: 'get email series' });
  },
});
