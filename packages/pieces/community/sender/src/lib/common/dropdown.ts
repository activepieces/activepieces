import { Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "./client";

export const groupDropdown = Property.Dropdown({
    displayName: "Groups",
    description: "Select one or more groups",
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: "Please connect your Sender account first",
            };
        }

        try {
            const groups = await makeRequest(auth as string, HttpMethod.GET, "/groups");

            return {
                disabled: false,
                options: groups.map((group: any) => ({
                    label: group.title,
                    value: group.id,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Error loading groups",
            };
        }
    },
});

export const subscriberDropdown = Property.MultiSelectDropdown<string>({
    displayName: "Subscribers",
    description: "Select one or more subscribers to delete",
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: "Please connect your Sender account first",
            };
        }

        try {
            const subscribers = await makeRequest(auth as string, HttpMethod.GET, "/subscribers");
            return {
                disabled: false,
                options: subscribers.map((sub: any) => ({
                    label: sub.email,
                    value: sub.email,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Error loading subscribers",
            };
        }
    },
});

export const campaignDropdown = Property.Dropdown({
    displayName: "Campaign",
    description: "Select a campaign",
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: "Please connect your Sender account first",
            };
        }

        try {
    
            const response: any = await makeRequest(
                auth as string,
                HttpMethod.GET,
                `/campaigns?limit=50&status=DRAFT`
            );

            const campaigns = response.data || [];

            return {
                disabled: false,
                options: campaigns.map((c: any) => ({
                    label: c.title || c.subject || c.id,
                    value: c.id,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Error loading campaigns",
            };
        }
    },
});