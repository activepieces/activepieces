import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateIdProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const addCandidateTags = createAction({
  auth: workableAuth,
  name: 'add_candidate_tags',
  classification: 'WRITE',
  displayName: 'Add Candidate Tags',
  description: 'Adds tags to a candidate and keeps the tags they already have.',
  audience: 'both',
  aiMetadata: {
    description:
      "Add one or more tags to a Workable candidate. Reads the candidate's current tags and saves the union, so existing tags stay and a second run changes nothing.",
    idempotent: true,
  },
  outputSchema: workableSchemas.tags,
  props: {
    account_subdomain: accountSubdomainProp,
    id: candidateIdProp,
    tags: Property.Array({ displayName: 'Tags', required: true }),
  },
  async run(context) {
    const p = context.propsValue;
    const v = workableValues;
    const wanted = v.stringList({ value: p.tags, label: 'Tags' }) ?? [];
    if (wanted.length === 0) {
      throw new Error('Give at least one tag to add.');
    }
    const id = encodeId({ value: p.id, label: 'Candidate ID' });
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    const current = workableOps.unwrap({ body: await client.request({ method: HttpMethod.GET, path: `/candidates/${id}` }), key: 'candidate' });
    const existing = v.list(current['tags']).map((tag) => v.str(tag)).filter((tag): tag is string => tag !== null);
    const lower = new Set(existing.map((tag) => tag.toLowerCase()));
    const added = wanted.filter((tag) => !lower.has(tag.toLowerCase()));
    const candidateId = decodeURIComponent(id);
    if (added.length === 0) {
      return { candidate_id: candidateId, tags: existing, added: [] };
    }
    const tags = [...existing, ...added];
    const body = await client.request({ method: HttpMethod.PUT, path: `/candidates/${id}/tags`, body: { tags } });
    const saved = v.list(v.rec(body)['tags']).map((tag) => v.str(tag)).filter((tag): tag is string => tag !== null);
    if (saved.length === 0) {
      return { candidate_id: candidateId, tags, added };
    }
    return { candidate_id: candidateId, tags: saved, added: saved.filter((tag) => !lower.has(tag.toLowerCase())) };
  },
});
