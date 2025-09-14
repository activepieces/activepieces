import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const TemplateDropdown = Property.Dropdown<string>({
    displayName: "Template",
    description: "Select a template for your presentation",
    required: true,
    refreshers: [], 
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: "Please connect your SlideSpeak account first",
                options: [],
            };
        }

        try {
            const response = await makeRequest(
                auth as string,
                HttpMethod.GET,
                "/presentation/templates"
            );

            const templates = response.templates || [];

            return {
                disabled: false,
                options: templates.map((t: any) => ({
                    label: t.name,
                    value: t.id,
                })),
            };
        } catch (error: any) {
            return {
                disabled: true,
                placeholder: `Error fetching templates: ${error.message || error}`,
                options: [],
            };
        }
    },
});
