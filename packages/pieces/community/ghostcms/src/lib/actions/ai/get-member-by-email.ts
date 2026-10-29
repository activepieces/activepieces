import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostClient, ghostCommon } from '../../common/client';
import { ghostGetMemberByEmailOutputSchema } from '../../output-schemas';

export const ghostGetMemberByEmail = createAction({
  auth: ghostAuth,
  name: 'ghost_get_member_by_email',
  outputSchema: ghostGetMemberByEmailOutputSchema,
  classification: 'READ',
  displayName: 'Get Member by Email',
  description: 'Find a member by exact email address.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up a member by exact email address and returns found true with the member, or found false when no member has that email. Use it to check whether someone is already a member before Create Member.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The member email address.',
      required: true,
    }),
  },
  async run(context) {
    const email = context.propsValue.email.trim();
    if (!email) {
      throw new Error('Email is required.');
    }
    const response = await ghostClient.request<{ members?: Record<string, unknown>[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/members',
      query: { filter: `email:${ghostCommon.nqlString(email)}`, limit: 1 },
    });
    const member = response.members?.[0] ?? null;
    return { found: member !== null, member };
  },
});
