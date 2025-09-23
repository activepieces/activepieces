import {
    Property,
    DynamicPropsValue,
    InputPropertyMap,
} from "@activepieces/pieces-framework";
import { EmailOctopusClient } from "./client";

export const emailOctopusProps = {
    listId: (required = true) => Property.Dropdown({
        displayName: 'List',
        description: 'The mailing list to use.',
        required: required,
        refreshers: [],
        options: async (context) => {
            const auth = context['auth'] as unknown as string;
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            const client = new EmailOctopusClient(auth);
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
        options: async (context) => {
            const auth = context['auth'] as unknown as string;
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            const client = new EmailOctopusClient(auth);
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
    
     fields: () => Property.DynamicProperties({
        displayName: 'Fields',
        description: 'The contact\'s custom fields.',
        required: true,
        refreshers: ['list_id'],
        props: async (context: Record<string, unknown>): Promise<InputPropertyMap> => {
            // FIX: Reading 'auth' and 'list_id' directly from the context object
            const auth = context['auth'] as unknown as string;
            const listId = context['list_id'] as string | undefined;

            if (!auth || !listId) {
                return {};
            }
            
            const client = new EmailOctopusClient(auth);
            const listDetails = await client.getList(listId);

            const fields: DynamicPropsValue = {};
            for (const field of listDetails.fields) {
                const fieldType = field.type.toLowerCase();
                if (fieldType === 'number') {
                    fields[field.tag] = Property.Number({
                        displayName: field.label,
                        required: false,
                    });
                } else if (fieldType === 'date') {
                    fields[field.tag] = Property.ShortText({
                        displayName: field.label,
                        description: 'Date in YYYY-MM-DD format.',
                        required: false,
                    });
                } else { // 'text' and any other types
                    fields[field.tag] = Property.ShortText({
                        displayName: field.label,
                        required: false,
                    });
                }
            }
            return fields;
        },
    }), 
};