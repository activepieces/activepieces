import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../../..';
import { mailchimpApi } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

export const resolveInterestAi = createAction({
  auth: mailchimpAuth,
  name: 'resolve_interest',
  classification: 'SEARCH',
  displayName: 'Resolve Interest (Group)',
  description: 'Find a group (interest) ID in an audience from its name.',
  audience: 'ai',
  aiMetadata: {
    description: 'Turns a Mailchimp group (interest) name into its interest ID and category ID within one audience (list_id). Optionally narrow by the group category title. Exact name matches win over partial ones. Returns found:false (not an error) when nothing matches and ambiguous:true with candidates when several match. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['resolveInterest'],
  props: {
    list_id: Property.ShortText({
      displayName: 'Audience ID',
      description: 'Audience (list) ID, from List Audiences or Resolve Audience.',
      required: true,
    }),
    name: Property.ShortText({ displayName: 'Group Name', required: true }),
    category_title: Property.ShortText({
      displayName: 'Category Title',
      description: 'Optional group category title to search in.',
      required: false,
    }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience ID' });
    const name = mailchimpApi.requireText({ value: context.propsValue.name, label: 'Group Name' });
    const categoryTitle = mailchimpApi.optionalText(context.propsValue.category_title);
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const basePath = `/lists/${encodeURIComponent(listId)}/interest-categories`;
    const allCategories = await client.listAll<Category>({
      path: basePath,
      itemsKey: 'categories',
      operation: 'list interest categories',
    });
    const categories =
      categoryTitle === undefined
        ? allCategories
        : mailchimpApi.matchByName({ items: allCategories, query: categoryTitle, names: (category) => [category.title] });
    const candidates: Candidate[] = [];
    for (const category of categories) {
      const interests = await client.listAll<Interest>({
        path: `${basePath}/${encodeURIComponent(category.id)}/interests`,
        itemsKey: 'interests',
        operation: 'list interests',
      });
      candidates.push(...interests.map((interest) => ({ id: interest.id, name: interest.name, category_id: category.id, category_title: category.title })));
    }
    const matches = mailchimpApi.matchByName({ items: candidates, query: name, names: (interest) => [interest.name] });
    if (matches.length === 0) {
      return { found: false, id: null, name: null, category_id: null, category_title: null, ambiguous: false, candidates: '' };
    }
    const best = matches[0];
    return {
      found: true,
      ...best,
      ambiguous: matches.length > 1,
      candidates: describeCandidates({ matches, label: (interest) => `${interest.name} in ${interest.category_title} (${interest.id})` }),
    };
  },
});

function describeCandidates<T>({ matches, label }: { matches: T[]; label: (item: T) => string }): string {
  return matches.slice(1, 11).map(label).join(', ');
}

type Category = { id: string; title: string };

type Interest = { id: string; name: string };

type Candidate = { id: string; name: string; category_id: string; category_title: string };
