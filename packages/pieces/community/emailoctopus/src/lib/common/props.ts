import {
    Property,
    DynamicPropsValue,
    DropdownState,
    InputPropertyMap,
    PropertyContext, 
} from "@activepieces/pieces-framework";
import { EmailOctopusClient } from "./client";


type AuthAndProps = {
    auth: string | undefined;
    propsValue: Record<string, unknown>;
}

export const emailOctopusProps = {
    listId: (required = true) => Property.Dropdown({
        displayName: 'List',
        description: 'The mailing list to use.',
        required: required,
        refreshers: [],
        options: async (context) => {
            const { auth } = context as AuthAndProps;
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
            const { auth } = context as AuthAndProps;
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
        props: async (dynamicPropsValue: Record<string, DynamicPropsValue>, context: PropertyContext): Promise<InputPropertyMap> => {
            const { auth, propsValue } = context as unknown as AuthAndProps;
            const listId = propsValue['list_id'] as string;

            if (!auth || !listId) {
                return {};
            }
            
            const client = new EmailOctopusClient(auth);
            const listDetails = await client.getList(listId);

            const fields: DynamicPropsValue = {};
            for (const field of listDetails.fields) {
                switch(field.type) {
                    case 'NUMBER':
                        fields[field.tag] = Property.Number({
                            displayName: field.label,
                            required: false,
                        });
                        break;
                    case 'DATE':
                        fields[field.tag] = Property.ShortText({
                            displayName: field.label,
                            description: 'Date in YYYY-MM-DD format.',
                            required: false,
                        });
                        break;
                    default: // TEXT
                        fields[field.tag] = Property.ShortText({
                            displayName: field.label,
                            required: false,
                        });
                        break;
                }
            }
            return fields;
        },
    }),
};