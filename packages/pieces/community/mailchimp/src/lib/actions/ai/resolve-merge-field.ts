import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../../..';
import { mailchimpApi } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

export const resolveMergeFieldAi = createAction({
  auth: mailchimpAuth,
  name: 'resolve_merge_field',
  classification: 'SEARCH',
  displayName: 'Resolve Merge Field',
  description: 'Find the merge tag of a contact field from its label.',
  audience: 'ai',
  aiMetadata: {
    description: 'Turns a contact field label (e.g. "Phone Number") or merge tag into the merge tag (e.g. PHONE) used as the key in merge_fields_json, within one audience (list_id). Also returns the field type and whether it is required. Returns found:false (not an error) when nothing matches and ambiguous:true with candidates when several match. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['resolveMergeField'],
  props: {
    list_id: Property.ShortText({
      displayName: 'Audience ID',
      description: 'Audience (list) ID, from List Audiences or Resolve Audience.',
      required: true,
    }),
    name: Property.ShortText({ displayName: 'Field Label or Tag', required: true }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience ID' });
    const name = mailchimpApi.requireText({ value: context.propsValue.name, label: 'Field Label or Tag' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const fields = await client.listAll<MergeField>({
      path: `/lists/${encodeURIComponent(listId)}/merge-fields`,
      itemsKey: 'merge_fields',
      operation: 'list merge fields',
    });
    const matches = mailchimpApi.matchByName({ items: fields, query: name, names: (field) => [field.name, field.tag] });
    if (matches.length === 0) {
      return { found: false, tag: null, name: null, merge_id: null, type: null, required: null, ambiguous: false, candidates: '' };
    }
    const best = matches[0];
    return {
      found: true,
      tag: best.tag,
      name: best.name,
      merge_id: best.merge_id,
      type: best.type,
      required: best.required ?? false,
      ambiguous: matches.length > 1,
      candidates: describeCandidates({ matches, label: (field) => `${field.name} (${field.tag})` }),
    };
  },
});

function describeCandidates<T>({ matches, label }: { matches: T[]; label: (item: T) => string }): string {
  return matches.slice(1, 11).map(label).join(', ');
}

type MergeField = { merge_id: number; tag: string; name: string; type: string; required?: boolean };
