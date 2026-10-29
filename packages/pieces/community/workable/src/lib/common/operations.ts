import { HttpMethod } from '@activepieces/pieces-common';
import { createWorkableClient, cursorFromPaging, encodeId, WorkableApiError, WorkableClient } from './client';
import { workableValues } from './values';

const v = workableValues;

function unwrap({ body, key }: { body: unknown; key: string }): Record<string, unknown> {
  const record = v.rec(body);
  return v.rec(key in record ? record[key] : record);
}

async function moveCandidate({
  client,
  candidateId,
  memberId,
  targetStage,
}: {
  client: WorkableClient;
  candidateId: unknown;
  memberId: unknown;
  targetStage: unknown;
}) {
  const id = encodeId({ value: candidateId, label: 'Candidate ID' });
  const member = v.optionalText(memberId);
  const stage = v.optionalText(targetStage);
  if (member === undefined) {
    throw new Error('Acting Member ID is required. Find it with Get Members.');
  }
  if (stage === undefined) {
    throw new Error('Target Stage is required. Use a stage slug from Get Stages, for example "phone-screen".');
  }
  await client.request({ method: HttpMethod.POST, path: `/candidates/${id}/move`, body: { member_id: member, target_stage: stage } });
  return { success: true, candidate_id: decodeURIComponent(id), target_stage: stage };
}

function buildCandidate(input: CandidateInput): Record<string, unknown> {
  const candidate: Record<string, unknown> = {};
  const firstname = v.optionalText(input.firstname);
  const lastname = v.optionalText(input.lastname);
  const email = v.optionalText(input.email);
  if (firstname === undefined || lastname === undefined) {
    throw new Error('First Name and Last Name are both required.');
  }
  if (email === undefined) {
    throw new Error('Email is required by Workable.');
  }
  candidate['firstname'] = firstname;
  candidate['lastname'] = lastname;
  candidate['email'] = email;
  for (const key of ['headline', 'summary', 'phone', 'address', 'cover_letter', 'resume_url'] as const) {
    const value = v.optionalText(input[key]);
    if (value !== undefined) {
      candidate[key] = value;
    }
  }
  const resumeUrl = candidate['resume_url'];
  if (typeof resumeUrl === 'string' && !/^https?:\/\//i.test(resumeUrl)) {
    throw new Error('Resume URL must start with http:// or https://.');
  }
  const skills = v.stringList({ value: input.skills, label: 'Skills' });
  if (skills !== undefined && skills.length > 0) {
    candidate['skills'] = skills;
  }
  const tags = v.stringList({ value: input.tags, label: 'Tags' });
  if (tags !== undefined && tags.length > 0) {
    candidate['tags'] = tags;
  }
  return candidate;
}

async function createCandidate({ client, jobShortcode, stage, sourced, input }: CreateCandidateParams) {
  const candidate = buildCandidate(input);
  const shortcode = v.optionalText(jobShortcode);
  const stageSlug = v.optionalText(stage);
  const path = shortcode === undefined ? '/talent_pool/candidates' : `/jobs/${encodeId({ value: shortcode, label: 'Job Shortcode' })}/candidates`;
  try {
    const body = await client.request({
      method: HttpMethod.POST,
      path,
      query: { stage: stageSlug },
      body: { sourced: sourced !== false, candidate },
    });
    return { ...unwrap({ body, key: 'candidate' }), talent_pool: shortcode === undefined };
  } catch (error) {
    if (error instanceof WorkableApiError && error.status === 422 && /already (exists|being used)/i.test(error.message)) {
      throw new WorkableApiError({
        message: `${error.message.replace(/\.?$/, '.')} Use List Candidates with this email to find the existing candidate, then Update Candidate or Copy Candidate to Job.`,
        status: error.status,
        responseBody: error.responseBody,
      });
    }
    throw error;
  }
}

async function listPage({
  client,
  path,
  key,
  query,
  limit,
  cursor,
}: {
  client: WorkableClient;
  path: string;
  key: string;
  query: Record<string, string | number | undefined>;
  limit: unknown;
  cursor: unknown;
}) {
  const pageSize = v.integer({ value: limit, label: 'Limit', min: 1, max: 100 }) ?? 50;
  const sinceId = v.optionalText(cursor);
  const body = await client.request({ method: HttpMethod.GET, path, query: { ...query, limit: pageSize, since_id: sinceId } });
  const items = v.records(v.rec(body)[key]);
  const nextCursor = cursorFromPaging({ subdomain: await client.getSubdomain(), body });
  return { [key]: items, count: items.length, nextCursor, hasMore: nextCursor !== null };
}

export const workableOps = { unwrap, moveCandidate, createCandidate, buildCandidate, listPage, client: createWorkableClient };

export type CandidateInput = {
  firstname?: unknown;
  lastname?: unknown;
  email?: unknown;
  headline?: unknown;
  summary?: unknown;
  phone?: unknown;
  address?: unknown;
  cover_letter?: unknown;
  resume_url?: unknown;
  skills?: unknown;
  tags?: unknown;
};

type CreateCandidateParams = {
  client: WorkableClient;
  jobShortcode: unknown;
  stage: unknown;
  sourced: unknown;
  input: CandidateInput;
};
