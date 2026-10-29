import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, jobDropdown, memberDropdown, stageDropdown } from '../common/props';
import { workableSchemas } from '../common/schemas';

export const moveCandidate = createAction({
  auth: workableAuth,
  name: 'moveCandidate',
  classification: 'WRITE',
  displayName: 'Move Candidate',
  description: 'Moves a candidate to another stage of their job pipeline.',
  audience: 'human',
  aiMetadata: {
    description:
      'Move a Workable candidate to a pipeline stage picked from dropdowns, recorded as the chosen hiring-team member. Running it again with the same stage leaves the candidate in that stage.',
    idempotent: false,
  },
  outputSchema: workableSchemas.moved,
  props: {
    account_subdomain: accountSubdomainProp,
    id: Property.ShortText({
      displayName: 'Candidate ID',
      description: 'The Workable candidate ID, for example "ce4da98".',
      required: true,
    }),
    job: jobDropdown({ displayName: 'Job', description: "The candidate's job, used only to list its stages.", required: false }),
    target_stage: stageDropdown({ required: true, description: 'Stage to move the candidate to.' }),
    member_id: memberDropdown({ description: 'The hiring-team member the move is recorded for.' }),
  },
  async run(context) {
    const p = context.propsValue;
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    return workableOps.moveCandidate({ client, candidateId: p.id, memberId: p.member_id, targetStage: p.target_stage });
  },
});
