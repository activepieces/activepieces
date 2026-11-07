import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId, WorkableClient } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateIdProp, memberIdText } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const copyCandidateToJob = createAction({
  auth: workableAuth,
  name: 'copy_candidate_to_job',
  classification: 'WRITE',
  displayName: 'Copy Candidate to Job',
  description: 'Copies a candidate to another job. The original stays where it is.',
  audience: 'both',
  aiMetadata: {
    description:
      'Copy a Workable candidate into another job (target job shortcode from List Jobs), optionally into a stage slug, on behalf of a hiring-team member. The original candidate is unchanged. Workable refuses a second copy into the same job.',
    idempotent: false,
  },
  outputSchema: workableSchemas.copied,
  props: {
    account_subdomain: accountSubdomainProp,
    id: candidateIdProp,
    member_id: memberIdText({ description: 'ID of the member making the copy. Find it with Get Members.' }),
    target_job_shortcode: Property.ShortText({ displayName: 'Target Job Shortcode', required: true }),
    target_stage: Property.ShortText({
      displayName: 'Target Stage Slug',
      description: 'Stage in the target job. Empty uses the first stage.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const v = workableValues;
    const memberId = v.optionalText(p.member_id);
    if (memberId === undefined) {
      throw new Error('Acting Member ID is required.');
    }
    const target = v.optionalText(p.target_job_shortcode);
    if (target === undefined) {
      throw new Error('Target Job Shortcode is required.');
    }
    const id = encodeId({ value: p.id, label: 'Candidate ID' });
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    const stage = v.optionalText(p.target_stage) ?? (await firstStageSlug({ client, shortcode: target }));
    const body = { member_id: memberId, target_job_shortcode: target, target_stage: stage };
    const response = await client.request({ method: HttpMethod.POST, path: `/candidates/${id}/copy`, body });
    return {
      source_candidate_id: decodeURIComponent(id),
      target_job_shortcode: target,
      candidate: workableOps.unwrap({ body: response, key: 'candidate' }),
    };
  },
});

async function firstStageSlug({ client, shortcode }: { client: WorkableClient; shortcode: string }): Promise<string> {
  const path = `/jobs/${encodeURIComponent(shortcode)}/stages`;
  const stages = workableValues.list(workableValues.rec(await client.request({ method: HttpMethod.GET, path }))['stages']);
  const slug = workableValues.str(workableValues.rec(stages[0])['slug']);
  if (slug === null) {
    throw new Error(`Job ${shortcode} has no pipeline stages, so the candidate cannot be copied there.`);
  }
  return slug;
}
