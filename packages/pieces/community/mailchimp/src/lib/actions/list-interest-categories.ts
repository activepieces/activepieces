import { createAction } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const listInterestCategories = createAction({
  auth: mailchimpAuth,
  name: 'list_interest_categories',
  classification: 'READ',
  displayName: 'List Groups (Interest Categories)',
  description: 'List the group categories of an audience together with the groups (interests) inside each one.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every interest category (Mailchimp "groups" title) of one audience (list_id), each with its interests (individual groups): interest ID, name and subscriber count. Interest IDs are what member interest settings use. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['interestCategories'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const basePath = `/lists/${encodeURIComponent(listId)}/interest-categories`;
    const categories = await client.listAll<InterestCategory>({
      path: basePath,
      itemsKey: 'categories',
      operation: 'list interest categories',
    });
    const result = [];
    for (const category of categories) {
      const interests = await client.listAll<Interest>({
        path: `${basePath}/${encodeURIComponent(category.id)}/interests`,
        itemsKey: 'interests',
        operation: 'list interests',
      });
      result.push({
        id: category.id,
        title: category.title,
        type: category.type,
        interests: interests.map((interest) => ({
          id: interest.id,
          name: interest.name,
          subscriber_count: Number(interest.subscriber_count ?? 0),
        })),
      });
    }
    return { categories: result };
  },
});

type InterestCategory = { id: string; title: string; type: string };

type Interest = { id: string; name: string; subscriber_count?: string | number };
