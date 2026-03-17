import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { googleChatApiAuth, googleChatCommon } from '../common';
import { spacesDropdown } from '../common/props';
import { googleChatAPIService } from '../common/requests';

export const findMember = createAction({
  auth: googleChatApiAuth,
  name: 'findMember',
  displayName: 'Find Member',
  description: 'Search space member by email',
  props: {
    spaceId: spacesDropdown({ refreshers: ['auth'], required: true }),
    email: Property.ShortText({
      displayName: 'Member Email',
      description: 'The email address of the member to find',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, googleChatCommon.findMemberSchema);

    const { spaceId, email } = propsValue;
    const accessToken = auth.access_token;

    try {
      const people = await googleChatAPIService.fetchPeople(
        accessToken
      );

      const person = people.find((p: any) =>
        p?.emailAddresses?.some(
          (e: any) => e.value.toLowerCase() === email.toLowerCase()
        )
      );

      if (!person) return { error: `No user found with email ${email}` };

      const spaceMemberId = (person.resourceName as string).replace('people', 'users');

      const spaceMembers = await googleChatAPIService.fetchSpaceMembers(
        accessToken,
        spaceId as string
      );

      const matchingMember = spaceMembers.find(
        (m: any) => m.member?.name === spaceMemberId
      );

      if (!matchingMember) return {
        error: `${email} is not a member of space ${spaceId}`,
      };

      return matchingMember;
    } catch (e) {
      console.error('Error finding member by email', e);
      return { error: 'Failed to retrieve member information' };
    }
  },
});
