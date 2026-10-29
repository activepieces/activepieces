import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const getStages = createAction({
  auth: workableAuth,
  name: 'getStages',
  classification: 'SEARCH',
  displayName: 'Get Stages',
  description: 'Lists the pipeline stages of a job, or of the account when no job is given.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Workable recruitment pipeline stages with slug, name and kind. Give a job shortcode for that job\'s pipeline, or leave it empty for the account-wide stages. Use to find valid stage slugs before moving or creating a candidate. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.stages,
  props: {
    account_subdomain: accountSubdomainProp,
    shortcode: Property.ShortText({
      displayName: 'Job Shortcode',
      description: 'Shortcode of the job. Empty lists the account-wide stages.',
      required: false,
    }),
  },
  async run(context) {
    const client = workableOps.client({ auth: context.auth, subdomain: context.propsValue.account_subdomain });
    const shortcode = workableValues.optionalText(context.propsValue.shortcode);
    const path = shortcode === undefined ? '/stages' : `/jobs/${encodeId({ value: shortcode, label: 'Job Shortcode' })}/stages`;
    const body = await client.request({ method: HttpMethod.GET, path });
    const stages = workableValues.records(workableValues.rec(body)['stages']);
    return { stages, count: stages.length };
  },
});
