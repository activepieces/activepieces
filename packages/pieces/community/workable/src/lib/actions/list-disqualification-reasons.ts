import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { workableOps } from '../common/operations';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const listDisqualificationReasons = createAction({
  auth: workableAuth,
  name: 'list_disqualification_reasons',
  classification: 'SEARCH',
  displayName: 'List Disqualification Reasons',
  description: 'Lists the disqualification reasons set up in the account.',
  audience: 'both',
  aiMetadata: {
    description: 'List the disqualification reasons of the Workable account with ID and name. Use the ID as Reason ID in Disqualify Candidate. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.disqualificationReasons,
  props: { account_subdomain: accountSubdomainProp },
  async run(context) {
    const client = workableOps.client({ auth: context.auth, subdomain: context.propsValue.account_subdomain });
    const body = await client.request({ method: HttpMethod.GET, path: '/disqualification_reasons' });
    const v = workableValues;
    const reasons = Array.isArray(body) ? v.records(body) : v.records(v.rec(body)['disqualification_reasons']);
    return { reasons, count: reasons.length };
  },
});
