import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfUtils } from '../common/utils';
import { listOrganizationMembersOutputSchema } from '../output-schemas';

export const listOrganizationMembers = createAction({
  auth: huggingFaceAuth,
  name: 'list_organization_members',
  classification: 'SEARCH',
  displayName: 'List Organization Members',
  description: 'List the members of a Hugging Face organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the members of a Hugging Face organization, one page per call with a next_cursor; each member has a username, full name, avatar and, where visible, their org role. Optionally narrow by a name search. The Email filter and member emails are only available to organization admins; other tokens should leave Email empty. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listOrganizationMembersOutputSchema,
  props: {
    organization: Property.ShortText({
      displayName: 'Organization',
      description: "The organization's Hub name, for example 'huggingface'.",
      required: true,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only members whose username or full name matches this text.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Only the member with this email address. Organization admins only.',
      required: false,
    }),
    limit: hfProps.limit({ defaultValue: 100, max: 10000 }),
    cursor: hfProps.cursor(),
  },
  async run(context) {
    const { organization, search, email, limit, cursor } = context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 10, max: 10000, name: 'Limit' });
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/organizations/${encodeURIComponent(organization.trim())}/members`,
      query: [
        ['search', search],
        ['email', email],
        ['limit', limit],
        ['cursor', cursor],
      ],
    });
    const members = Array.isArray(response.body) ? response.body : [];
    return {
      members,
      count: members.length,
      next_cursor: hfHub.parseNextCursor(response.headers),
    };
  },
});
