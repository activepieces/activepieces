import { createAction } from "@activepieces/pieces-framework";
import {
    circleSoAuth,
    circleSoBaseUrl,
    listCommunityMembersDropdown,
    CommunityMemberDetails
} from "../common";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getMemberDetails = createAction({
    auth: circleSoAuth,
    name: 'get_member_details',
    displayName: 'Get Member Details',
    description: 'Fetches the full profile details for a specific community member.',
    props: {
        member_id: listCommunityMembersDropdown,
    },
    async run(context) {
        const { member_id } = context.propsValue;
        if (member_id === undefined) {
            throw new Error("Member ID is undefined, but it is a required field.");
        }

        const response = await httpClient.sendRequest<CommunityMemberDetails>({
            method: HttpMethod.GET,
            url: `${circleSoBaseUrl}/community_members/${member_id}`,
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            },
        });
        return response.body;
    }
});
