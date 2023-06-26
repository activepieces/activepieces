import { Property } from "@activepieces/pieces-framework";

export const bloomerangCommon = {
    baseUrl: "https://api.bloomerang.co/v2",
    authentication: Property.SecretText({
        displayName: "API Key",
        required: true,
        description: "API key acquired from your Bloomerang crm"
    }),
    transaction_stuff: Property.Dropdown<string>({
        displayName: "Transaction stuff",
        required: true,
        description: "Select the object",
        refreshers: [],
        options: async () => {
            return {
                options: [
                    {
                        label: "Campaign",
                        value: "campaigns",
                    },
                    {
                        label: "Appeal",
                        value: "appeals",
                    },
                    {
                        label: "Fund",
                        value: "funds",
                    }
                ]
            }
        }
    }),
    contact_type: Property.Dropdown<string>({
        displayName: "Contact type",
        required: false,
        description: "Select the object",
        refreshers: [],
        options: async () => {
            return {
                options: [
                    {
                        label: "Individual",
                        value: "Individual",
                    },
                    {
                        label: "Organization",
                        value: "Organization",
                    },
                    {
                        label: "Household",
                        value: "Household",
                    }
                ]
            }
        }
    }),
}
