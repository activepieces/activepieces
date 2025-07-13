import { HttpMethod } from "@activepieces/pieces-common";
import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";

export const modelIdDropdown = Property.Dropdown({
    displayName: 'Models',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        
        const models = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/models',
            {}
        );
        const options = models.data.map((field: { id: string; name: string }) => {
            return {
                label: field.name,
                value: field.id,
            };
        });

        return {
            options,
        };
    },
})