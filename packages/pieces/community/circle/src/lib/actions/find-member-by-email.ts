import { Property, createAction } from "@activepieces/pieces-framework";
import { BASE_URL } from "../common";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { circleAuth } from "../common/auth";
import { CommunityMemberDetails } from "../common/types";

export const findMemberByEmail = createAction({
    auth: circleAuth,
    name: 'find_member_by_email',
    displayName: 'Find Member by Email',
    description: 'Finds a community member by their email address.',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The email address of the member to find.',
            required: true,
        }),
    },
    async run(context) {
        const { email } = context.propsValue;

        if (email === undefined) {
            throw new Error("Email is undefined, but it is a required field.");
        }

        const response = await httpClient.sendRequest<CommunityMemberDetails>({
            method: HttpMethod.GET,
            url: `${BASE_URL}/community_members/search`,
            queryParams: {
                email: email,
            },
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            },
        });

        return response.body;
    }
});
