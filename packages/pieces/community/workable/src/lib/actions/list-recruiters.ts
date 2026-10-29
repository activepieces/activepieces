import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const listRecruiters = createAction({
  auth: workableAuth,
  name: 'list_recruiters',
  classification: 'SEARCH',
  displayName: 'List Recruiters',
  description: 'Lists external recruiters of the account or of one job.',
  audience: 'both',
  aiMetadata: {
    description: 'List the external recruiters (agencies) of the Workable account, or of one job when a job shortcode is given, with ID, name and email. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.recruiters,
  props: {
    account_subdomain: accountSubdomainProp,
    shortcode: Property.ShortText({ displayName: 'Job Shortcode', description: 'Only recruiters of this job.', required: false }),
  },
  async run(context) {
    const client = workableOps.client({ auth: context.auth, subdomain: context.propsValue.account_subdomain });
    const shortcode = workableValues.optionalText(context.propsValue.shortcode);
    const path = shortcode === undefined ? '/recruiters' : `/jobs/${encodeId({ value: shortcode, label: 'Job Shortcode' })}/recruiters`;
    const body = await client.request({ method: HttpMethod.GET, path });
    const recruiters = workableValues.records(workableValues.rec(body)['recruiters']);
    return { recruiters, count: recruiters.length };
  },
});
