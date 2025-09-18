import { Property } from "@activepieces/pieces-framework";
import { EmailOctopusClient } from "./client";

export const emailOctopusProps = {
    listId: (required = true) => Property.Dropdown({
        displayName: 'List',
        description: 'The mailing list to use.',
        required: required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            const client = new EmailOctopusClient(auth as string);
            const lists = await client.getLists();
            return {
                disabled: false,
                options: lists.map((list) => ({
                    label: list.name,
                    value: list.id,
                })),
            };
        },
    }),


    campaignId: (required = false) => Property.Dropdown({
        displayName: 'Campaign',
        description: 'Select a campaign to filter events. Leave blank to trigger for all campaigns.',
        required: required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            const client = new EmailOctopusClient(auth as string);
            const campaigns = await client.getCampaigns();
            return {
                disabled: false,
                options: campaigns.map((campaign) => ({
                    label: campaign.name,
                    value: campaign.id,
                })),
            };
        },
    }),
};