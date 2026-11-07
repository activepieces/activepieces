import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId, WorkableApiError } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateIdProp, memberIdText } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

const MAX_GRADE: Record<string, number> = { thumbs: 2, stars: 4, numbers: 9 };

export const rateCandidate = createAction({
  auth: workableAuth,
  name: 'rateCandidate',
  classification: 'WRITE',
  displayName: 'Rate Candidate',
  description: 'Adds a rating with a comment to a candidate.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add a rating with a comment to a Workable candidate on behalf of a hiring-team member. Scale thumbs takes grade 0-2, stars 0-4, numbers 0-9 (whole numbers); out-of-range grades are refused before calling Workable. Find the member ID with Get Members. Each member can rate a candidate once; a second rating by the same member is refused. Talent-pool candidates (no job) cannot be rated.',
    idempotent: false,
  },
  outputSchema: workableSchemas.rated,
  props: {
    account_subdomain: accountSubdomainProp,
    id: candidateIdProp,
    member_id: memberIdText({ description: 'ID of the member adding the rating. Find it with Get Members.' }),
    comment: Property.LongText({ displayName: 'Comment', description: 'Comment about the rating.', required: true }),
    scale: Property.StaticDropdown({
      displayName: 'Rating Scale',
      required: true,
      options: {
        options: [
          { label: 'Thumbs (0-2)', value: 'thumbs' },
          { label: 'Stars (0-4)', value: 'stars' },
          { label: 'Numbers (0-9)', value: 'numbers' },
        ],
      },
    }),
    grade: Property.Number({ displayName: 'Grade', description: 'Thumbs: 0-2, Stars: 0-4, Numbers: 0-9.', required: true }),
  },
  async run(context) {
    const p = context.propsValue;
    const scale = workableValues.optionalText(p.scale);
    if (scale === undefined || MAX_GRADE[scale] === undefined) {
      throw new Error('Rating Scale must be thumbs, stars or numbers.');
    }
    const grade = workableValues.integer({ value: p.grade, label: `Grade for the ${scale} scale`, min: 0, max: MAX_GRADE[scale] });
    if (grade === undefined) {
      throw new Error('Grade is required.');
    }
    const comment = workableValues.optionalText(p.comment);
    if (comment === undefined) {
      throw new Error('Comment is required.');
    }
    const memberId = workableValues.optionalText(p.member_id);
    if (memberId === undefined) {
      throw new Error('Acting Member ID is required.');
    }
    const id = encodeId({ value: p.id, label: 'Candidate ID' });
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    try {
      await client.request({
        method: HttpMethod.POST,
        path: `/candidates/${id}/ratings`,
        body: { member_id: memberId, comment, scale, grade },
      });
    } catch (error) {
      if (error instanceof WorkableApiError && error.status === 422) {
        throw new WorkableApiError({
          message: `${error.message} Workable allows one rating per member per candidate, so this member may already have rated this candidate.`,
          status: error.status,
          responseBody: error.responseBody,
        });
      }
      throw error;
    }
    return { success: true, candidate_id: decodeURIComponent(id), scale, grade };
  },
});
