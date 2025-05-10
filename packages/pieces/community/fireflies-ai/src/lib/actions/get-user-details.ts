import { Property, createAction } from "@activepieces/pieces-framework";
import { callFirefliesApi } from "../common";
import { firefliesAiAuth } from "../../index";

interface FirefliesUserGroup {
    name?: string;
    handle?: string;
}

interface FirefliesUserDetails {
    user_id: string;
    name?: string;
    email?: string;
    recent_transcript?: string;
    recent_meeting?: string;
    num_transcripts?: number;
    minutes_consumed?: number;
    is_admin?: boolean;
    integrations?: string[];
    user_groups?: FirefliesUserGroup[];
}

interface FirefliesGetUserResponse {
    user: FirefliesUserDetails;
}

export const getUserDetailsAction = createAction({
    name: 'get_user_details',
    displayName: 'Get User Details',
    description: 'Fetch profile information of a Fireflies user. If no User ID is provided, it fetches details for the API key owner.',
    auth: firefliesAiAuth,
    props: {
        userId: Property.ShortText({
            displayName: 'User ID (Optional)',
            description: 'The ID of the user to fetch. Leave blank to fetch details for the API key owner.',
            required: false,
        }),
    },
    async run(context) {
        const apiKey = context.auth as string;
        const { userId } = context.propsValue;

        // Base query without the id argument
        let query = `
            query User {
                user {
                    user_id
                    name
                    email
                    recent_transcript
                    recent_meeting
                    num_transcripts
                    minutes_consumed
                    is_admin
                    integrations
                    user_groups {
                        name
                        handle
                    }
                }
            }
        `;

        const variables: Record<string, unknown> = {};

        // If userId is provided, modify the query and add the variable
        if (userId) {
            query = `
                query User($userId: String!) {
                    user(id: $userId) {
                        user_id
                        name
                        email
                        recent_transcript
                        recent_meeting
                        num_transcripts
                        minutes_consumed
                        is_admin
                        integrations
                        user_groups {
                            name
                            handle
                        }
                    }
                }
            `;
            variables['userId'] = userId;
        }

        const response = await callFirefliesApi<FirefliesGetUserResponse>(apiKey, query, variables);
        return response.user;
    },
});
