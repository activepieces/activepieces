import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

// Define the correct base URL here. This is the source of the 404 error.
export const GCHAT_API_URL = 'https://chat.googleapis.com/v1';

export const googleChatCommon = {
    // This property makes the API call to get the list of spaces.
    space: Property.Dropdown({
        displayName: 'Space',
        description: 'The space to send the message to.',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            const authProp = auth as OAuth2PropertyValue;
            const response = await httpClient.sendRequest<{ spaces: { name: string, displayName: string }[] }>({
                method: HttpMethod.GET,
                // This now uses the correct URL, which will resolve the 404 error.
                url: `${GCHAT_API_URL}/spaces`,
                headers: {
                    Authorization: `Bearer ${authProp.access_token}`,
                },
            });

            if (response.status === 200) {
                return {
                    disabled: false,
                    options: (response.body.spaces??[]).map(space => ({
                        label: space.displayName,
                        value: space.name,
                    })),
                };
            }

            return {
                disabled: true,
                options: [],
                placeholder: "Couldn't load spaces, please check your connection and permissions."
            };
        }
    }),
};
