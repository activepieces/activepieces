import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../../..';
import { mailchimpApi } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

export const resolveSegmentAi = createAction({
  auth: mailchimpAuth,
  name: 'resolve_segment',
  classification: 'SEARCH',
  displayName: 'Resolve Segment',
  description: 'Find a segment or tag ID in an audience from its name.',
  audience: 'ai',
  aiMetadata: {
    description: 'Turns a segment or tag name into its numeric segment_id within one audience (list_id). Covers saved, static and fuzzy segments and tags (tags are static segments in Mailchimp). Exact name matches win over partial ones. Returns found:false (not an error) when nothing matches and ambiguous:true with candidates when several match. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['resolveSegment'],
  props: {
    list_id: Property.ShortText({
      displayName: 'Audience ID',
      description: 'Audience (list) ID, from List Audiences or Resolve Audience.',
      required: true,
    }),
    name: Property.ShortText({ displayName: 'Segment or Tag Name', required: true }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience ID' });
    const name = mailchimpApi.requireText({ value: context.propsValue.name, label: 'Segment or Tag Name' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const segments = await client.listAll<Segment>({
      path: `/lists/${encodeURIComponent(listId)}/segments`,
      itemsKey: 'segments',
      queryParams: { fields: 'segments.id,segments.name,segments.type,segments.member_count,total_items' },
      operation: 'list segments',
    });
    const matches = mailchimpApi.matchByName({ items: segments, query: name, names: (segment) => [segment.name] });
    if (matches.length === 0) {
      return { found: false, id: null, name: null, type: null, member_count: null, ambiguous: false, candidates: '' };
    }
    const best = matches[0];
    return {
      found: true,
      id: String(best.id),
      name: best.name,
      type: best.type,
      member_count: best.member_count ?? 0,
      ambiguous: matches.length > 1,
      candidates: describeCandidates({ matches, label: (segment) => `${segment.name} (${segment.id})` }),
    };
  },
});

function describeCandidates<T>({ matches, label }: { matches: T[]; label: (item: T) => string }): string {
  return matches.slice(1, 11).map(label).join(', ');
}

type Segment = { id: number; name: string; type: string; member_count?: number };
