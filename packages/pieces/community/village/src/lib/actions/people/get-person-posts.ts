import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getPersonPosts = createAction({
  auth: villageAuth,
  name: 'get_person_posts',
  classification: 'READ',
  displayName: 'Get Person LinkedIn Posts',
  description:
    "Get a page of a person's recent LinkedIn posts, with engagement counts. Costs 1 Village credit per page.",
  audience: 'both',
  aiMetadata: {
    description:
      "Read a page of one person's recent LinkedIn posts (content, date, likes/comments/shares) from their LinkedIn profile URL. Costs 1 credit per call/page, so request only the pages you need; follow pagination.cursor for more. Read-only, but each repeat call is charged again, so it is not idempotent.",
    idempotent: false,
  },
  outputSchema: villageSchemas.getPersonPosts,
  props: {
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: 'LinkedIn profile URL, e.g. https://linkedin.com/in/johndoe',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Posts per page (1-50, default 20).',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'pagination.cursor from a previous call.',
      required: false,
    }),
  },
  async run(context) {
    const { linkedin_url, limit, cursor } = context.propsValue;
    const body: Record<string, unknown> = {
      linkedin_url: villageApi.requireText({ value: linkedin_url, field: 'LinkedIn URL' }),
      limit: villageApi.clampLimit({ value: limit, max: 50, fallback: 20 }),
    };
    if (cursor) {
      body['cursor'] = cursor;
    }
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/people/posts',
      body,
    });
  },
});
