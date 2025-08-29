import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

// Define the correct base URL here, in one central place.
export const GCHAT_API_URL = 'https://chat.googleapis.com/v1';

export const googleChatCommon = {
    // Property to create a dropdown for selecting a space
    space: Property.Dropdown({
        displayName: 'Space',
        description: 'The space to send the message to.',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            const authProp = auth as OAuth2PropertyValue;
            const response = await httpClient.sendRequest<{ spaces: { name: string, displayName: string }[] }>({
                method: HttpMethod.GET,
                // Use the centrally defined URL
                url: `${GCHAT_API_URL}/spaces`,
                headers: {
                    Authorization: `Bearer ${authProp.access_token}`,
                },
            });

            if (response.status === 200) {
                return {
                    disabled: false,
                    options: response.body.spaces.map(space => ({
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
