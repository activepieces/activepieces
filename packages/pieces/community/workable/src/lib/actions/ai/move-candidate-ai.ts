import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../../auth';
import { workableOps } from '../../common/operations';
import { accountSubdomainProp, candidateIdProp, memberIdText } from '../../common/props';
import { workableSchemas } from '../../common/schemas';

export const moveCandidateAi = createAction({
  auth: workableAuth,
  name: 'move_candidate_ai',
  classification: 'WRITE',
  displayName: 'Move Candidate (by IDs)',
  description: 'Moves a candidate to a pipeline stage given by its slug.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Move a Workable candidate to another stage of their job pipeline. Needs the candidate ID, the acting member ID (from Get Members) and the target stage slug (from Get Stages for the candidate's job, for example \"phone-screen\"). Running it again with the same stage leaves the candidate there.",
    idempotent: false,
  },
  outputSchema: workableSchemas.moved,
  props: {
    account_subdomain: accountSubdomainProp,
    id: candidateIdProp,
    member_id: memberIdText({ description: 'ID of the member the move is recorded for. Find it with Get Members.' }),
    target_stage: Property.ShortText({
      displayName: 'Target Stage Slug',
      description: 'Slug of the stage, for example "phone-screen". Find it with Get Stages.',
      required: true,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    return workableOps.moveCandidate({ client, candidateId: p.id, memberId: p.member_id, targetStage: p.target_stage });
  },
});
