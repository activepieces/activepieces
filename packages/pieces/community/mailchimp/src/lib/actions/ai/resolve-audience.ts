import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../../..';
import { mailchimpApi } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

export const resolveAudienceAi = createAction({
  auth: mailchimpAuth,
  name: 'resolve_audience',
  classification: 'SEARCH',
  displayName: 'Resolve Audience',
  description: 'Find an audience ID from its name.',
  audience: 'ai',
  aiMetadata: {
    description: 'Turns an audience (list) name into its list_id. Exact name matches (case-insensitive) win over partial matches. Returns found:false (not an error) when nothing matches; ambiguous:true with the other candidates when several match, in which case ask the user or use List Audiences. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['resolveAudience'],
  props: {
    name: Property.ShortText({ displayName: 'Audience Name', required: true }),
  },
  async run(context) {
    const name = mailchimpApi.requireText({ value: context.propsValue.name, label: 'Audience Name' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const lists = await client.listAll<Audience>({
      path: '/lists',
      itemsKey: 'lists',
      queryParams: { fields: 'lists.id,lists.name,lists.stats.member_count,total_items' },
      operation: 'list audiences',
    });
    const matches = mailchimpApi.matchByName({ items: lists, query: name, names: (list) => [list.name] });
    if (matches.length === 0) {
      return { found: false, id: null, name: null, member_count: null, ambiguous: false, candidates: '' };
    }
    const best = matches[0];
    return {
      found: true,
      id: best.id,
      name: best.name,
      member_count: best.stats?.member_count ?? 0,
      ambiguous: matches.length > 1,
      candidates: describeCandidates({ matches, label: (list) => `${list.name} (${list.id})` }),
    };
  },
});

function describeCandidates<T>({ matches, label }: { matches: T[]; label: (item: T) => string }): string {
  return matches.slice(1, 11).map(label).join(', ');
}

type Audience = { id: string; name: string; stats?: { member_count?: number } };
